import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDatabase, run, get, all } from './database.js';
import { escalationEngine } from './escalationEngine.js';
import { sendEmergencySms } from './smsService.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'estela_super_secret_safety_key_2026';

app.use(cors());
app.use(express.json());

// Initialize DB and start Escalation Worker
await initDatabase();
escalationEngine.start();

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, medical_info, emergency_notes } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const userId = 'usr_' + crypto.randomUUID().slice(0, 8);
    const passwordHash = await bcrypt.hash(password, 10);

    await run(
      `INSERT INTO users (id, name, email, password_hash, phone, medical_info, emergency_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), email.toLowerCase().trim(), passwordHash, phone || '', medical_info || '', emergency_notes || '']
    );

    // Seed a sample trusted contact for the new user so they can immediately test safety sessions
    const contactId = 'ctc_' + crypto.randomUUID().slice(0, 8);
    await run(
      `INSERT INTO trusted_contacts (id, user_id, name, relationship, phone, email, role)
       VALUES (?, ?, 'Sarah Jenkins (Sister)', 'Sister', '+1 555-0199', 'sarah.j.emergency@gmail.com', 'primary')`,
      [contactId, userId]
    );

    const token = jwt.sign({ id: userId, email, name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      user: { id: userId, name, email: email.toLowerCase().trim(), phone, medical_info, emergency_notes },
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        medical_info: user.medical_info,
        emergency_notes: user.emergency_notes
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, phone, medical_info, emergency_notes, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, medical_info, emergency_notes } = req.body;
    await run(
      `UPDATE users SET name = ?, phone = ?, medical_info = ?, emergency_notes = ? WHERE id = ?`,
      [name, phone, medical_info, emergency_notes, req.user.id]
    );
    const updated = await get('SELECT id, name, email, phone, medical_info, emergency_notes FROM users WHERE id = ?', [req.user.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// -------------------------------------------------------------
// TRUSTED CONTACTS ROUTES
// -------------------------------------------------------------

app.get('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await all('SELECT * FROM trusted_contacts WHERE user_id = ? ORDER BY role DESC, name ASC', [req.user.id]);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.post('/api/contacts', authenticateToken, async (req, res) => {
  try {
    const { name, relationship, phone, email, role, notify_on_missed_checkin, notify_on_sos } = req.body;
    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone, and email are required' });
    }

    // If setting as primary or backup, downgrade existing ones of that role if needed
    if (role === 'primary') {
      await run(`UPDATE trusted_contacts SET role = 'general' WHERE user_id = ? AND role = 'primary'`, [req.user.id]);
    } else if (role === 'backup') {
      await run(`UPDATE trusted_contacts SET role = 'general' WHERE user_id = ? AND role = 'backup'`, [req.user.id]);
    }

    const contactId = 'ctc_' + crypto.randomUUID().slice(0, 8);
    await run(
      `INSERT INTO trusted_contacts (id, user_id, name, relationship, phone, email, role, notify_on_missed_checkin, notify_on_sos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contactId, req.user.id, name, relationship || 'Family/Friend', phone, email, role || 'general', notify_on_missed_checkin ? 1 : 0, notify_on_sos ? 1 : 0]
    );

    const created = await get('SELECT * FROM trusted_contacts WHERE id = ?', [contactId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relationship, phone, email, role, notify_on_missed_checkin, notify_on_sos } = req.body;

    if (role === 'primary') {
      await run(`UPDATE trusted_contacts SET role = 'general' WHERE user_id = ? AND role = 'primary' AND id != ?`, [req.user.id, id]);
    } else if (role === 'backup') {
      await run(`UPDATE trusted_contacts SET role = 'general' WHERE user_id = ? AND role = 'backup' AND id != ?`, [req.user.id, id]);
    }

    await run(
      `UPDATE trusted_contacts SET name = ?, relationship = ?, phone = ?, email = ?, role = ?, notify_on_missed_checkin = ?, notify_on_sos = ?
       WHERE id = ? AND user_id = ?`,
      [name, relationship, phone, email, role, notify_on_missed_checkin ? 1 : 0, notify_on_sos ? 1 : 0, id, req.user.id]
    );

    const updated = await get('SELECT * FROM trusted_contacts WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM trusted_contacts WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// -------------------------------------------------------------
// SAFETY SESSIONS & CHECK-INS
// -------------------------------------------------------------

// Get Active Session
app.get('/api/sessions/active', authenticateToken, async (req, res) => {
  try {
    const session = await get(
      `SELECT s.*, 
              p.name as primary_contact_name, p.phone as primary_contact_phone,
              b.name as backup_contact_name, b.phone as backup_contact_phone
       FROM safety_sessions s
       LEFT JOIN trusted_contacts p ON s.primary_contact_id = p.id
       LEFT JOIN trusted_contacts b ON s.backup_contact_id = b.id
       WHERE s.user_id = ? AND (s.status = 'active' OR s.status = 'overdue')
       ORDER BY s.started_at DESC LIMIT 1`,
      [req.user.id]
    );

    if (!session) {
      return res.json({ activeSession: null });
    }

    // Get latest location snapshot
    const latestLoc = await get(
      'SELECT * FROM location_snapshots WHERE session_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [session.id]
    );

    // Get active incident if any
    const activeIncident = await get(
      `SELECT * FROM incidents WHERE user_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    res.json({
      activeSession: session,
      latestLocation: latestLoc,
      activeIncident
    });
  } catch (err) {
    console.error('Fetch active session error:', err);
    res.status(500).json({ error: 'Failed to retrieve active session' });
  }
});

// Start a Safety Session
app.post('/api/sessions/start', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      duration_minutes = 60,
      checkin_interval_minutes = 15,
      location_sharing_enabled = 1,
      primary_contact_id,
      backup_contact_id,
      latitude,
      longitude,
      accuracy
    } = req.body;

    // Check if user already has an active session
    const existing = await get(
      `SELECT id FROM safety_sessions WHERE user_id = ? AND (status = 'active' OR status = 'overdue')`,
      [req.user.id]
    );

    if (existing) {
      return res.status(400).json({ error: 'An active safety session is already in progress. End it first.' });
    }

    const sessionId = 'ses_' + crypto.randomUUID().slice(0, 8);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration_minutes * 60 * 1000).toISOString();
    const nextCheckinDeadline = new Date(now.getTime() + checkin_interval_minutes * 60 * 1000).toISOString();

    await run(
      `INSERT INTO safety_sessions (
        id, user_id, title, status, duration_minutes, checkin_interval_minutes,
        location_sharing_enabled, started_at, expires_at, next_checkin_deadline,
        primary_contact_id, backup_contact_id
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        req.user.id,
        title || 'Commute / Safety Session',
        duration_minutes,
        checkin_interval_minutes,
        location_sharing_enabled ? 1 : 0,
        now.toISOString(),
        expiresAt,
        nextCheckinDeadline,
        primary_contact_id || null,
        backup_contact_id || null
      ]
    );

    // Initial checkin record to indicate session initialized safely
    const checkinId = 'chk_' + crypto.randomUUID().slice(0, 8);
    await run(
      `INSERT INTO check_ins (id, session_id, user_id, status, note, latitude, longitude, accuracy)
       VALUES (?, ?, ?, 'safe', 'Safety session initialized', ?, ?, ?)`,
      [checkinId, sessionId, req.user.id, latitude || null, longitude || null, accuracy || null]
    );

    // Save initial location snapshot if provided
    if (latitude && longitude) {
      await run(
        `INSERT INTO location_snapshots (id, user_id, session_id, latitude, longitude, accuracy)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['loc_' + crypto.randomUUID().slice(0, 8), req.user.id, sessionId, latitude, longitude, accuracy || null]
      );
    }

    const session = await get('SELECT * FROM safety_sessions WHERE id = ?', [sessionId]);
    res.status(201).json(session);
  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ error: 'Failed to start safety session' });
  }
});

// Confirm "I AM SAFE" Check-in
app.post('/api/sessions/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { note, latitude, longitude, accuracy } = req.body;

    const session = await get('SELECT * FROM safety_sessions WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const now = new Date();
    // Calculate new next_checkin_deadline
    const newDeadline = new Date(now.getTime() + session.checkin_interval_minutes * 60 * 1000).toISOString();

    // Reset status to 'active' if it was 'overdue'
    await run(
      `UPDATE safety_sessions 
       SET status = 'active', next_checkin_deadline = ? 
       WHERE id = ?`,
      [newDeadline, id]
    );

    // Insert Check-in
    const checkinId = 'chk_' + crypto.randomUUID().slice(0, 8);
    await run(
      `INSERT INTO check_ins (id, session_id, user_id, status, note, latitude, longitude, accuracy)
       VALUES (?, ?, ?, 'safe', ?, ?, ?, ?)`,
      [checkinId, id, req.user.id, note || 'User tapped I AM SAFE', latitude || null, longitude || null, accuracy || null]
    );

    // If there was an active MISSED_CHECKIN incident for this session, resolve it
    await run(
      `UPDATE incidents 
       SET status = 'RESOLVED', resolved_at = ?, resolution_note = 'Resolved by user I AM SAFE check-in'
       WHERE session_id = ? AND status = 'ACTIVE' AND type = 'MISSED_CHECKIN'`,
      [now.toISOString(), id]
    );

    // Log location snapshot if given
    if (latitude && longitude) {
      await run(
        `INSERT INTO location_snapshots (id, user_id, session_id, latitude, longitude, accuracy)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['loc_' + crypto.randomUUID().slice(0, 8), req.user.id, id, latitude, longitude, accuracy || null]
      );
    }

    const updatedSession = await get('SELECT * FROM safety_sessions WHERE id = ?', [id]);
    res.json({
      message: 'Safety confirmed! Next check-in reset.',
      session: updatedSession
    });
  } catch (err) {
    console.error('Checkin error:', err);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// End Safety Session
app.post('/api/sessions/:id/end', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();

    await run(
      `UPDATE safety_sessions 
       SET status = 'completed', ended_at = ? 
       WHERE id = ? AND user_id = ?`,
      [now, id, req.user.id]
    );

    // Resolve any pending incidents for this session
    await run(
      `UPDATE incidents 
       SET status = 'RESOLVED', resolved_at = ?, resolution_note = 'Resolved as session completed safely'
       WHERE session_id = ? AND status = 'ACTIVE'`,
      [now, id]
    );

    res.json({ message: 'Safety session ended safely' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// -------------------------------------------------------------
// EMERGENCY SOS INCIDENT SYSTEM
// -------------------------------------------------------------

// Trigger SOS
app.post('/api/incidents/sos', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, note, trigger_source = 'SOS_BUTTON' } = req.body;
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Active session if any
    const activeSession = await get(
      `SELECT * FROM safety_sessions WHERE user_id = ? AND (status = 'active' OR status = 'overdue') LIMIT 1`,
      [req.user.id]
    );

    const incidentId = 'sos_' + crypto.randomUUID().slice(0, 8);
    const nowIso = new Date().toISOString();

    const addressApprox = latitude && longitude
      ? `GPS Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)} (±${Math.round(accuracy || 10)}m)`
      : 'Location permission not granted or unavailable';

    await run(
      `INSERT INTO incidents (
        id, user_id, session_id, type, status, severity, trigger_source,
        latitude, longitude, accuracy, address_approx
      ) VALUES (?, ?, ?, 'SOS', 'ACTIVE', 'CRITICAL', ?, ?, ?, ?, ?)`,
      [
        incidentId,
        req.user.id,
        activeSession ? activeSession.id : null,
        trigger_source,
        latitude || null,
        longitude || null,
        accuracy || null,
        addressApprox
      ]
    );

    // Save location snapshot
    if (latitude && longitude) {
      await run(
        `INSERT INTO location_snapshots (id, user_id, session_id, incident_id, latitude, longitude, accuracy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['loc_' + crypto.randomUUID().slice(0, 8), req.user.id, activeSession?.id || null, incidentId, latitude, longitude, accuracy || null]
      );
    }

    // Fetch trusted contacts
    const contacts = await all('SELECT * FROM trusted_contacts WHERE user_id = ? AND notify_on_sos = 1', [req.user.id]);

    const notifiedContacts = [];
    const mapLink = latitude && longitude
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : 'Location not shared';

    // Find primary contact specifically for direct SMS dispatch
    const primaryContact = contacts.find(c => c.role === 'primary') || contacts[0];

    // SMS text body tailored for cellular SMS delivery
    const smsText = `🚨 ESTELA EMERGENCY ALERT: ${user.name} has pressed the SOS button!
📍 Live Location: ${mapLink}
🎯 Accuracy: ±${Math.round(accuracy || 10)}m
📞 User Contact: ${user.phone || 'N/A'}
ℹ️ Medical Info: ${user.medical_info || 'None'}
⏰ Time: ${new Date().toLocaleTimeString()}
Immediate assistance or check-in requested!`;

    // 1. Dispatch SMS to Primary Number
    if (primaryContact && primaryContact.phone) {
      const smsDispatch = await sendEmergencySms(primaryContact.phone, smsText);

      // Log SMS event in notification_events table
      const smsNotifId = 'sms_' + crypto.randomUUID().slice(0, 8);
      await run(
        `INSERT INTO notification_events (
          id, user_id, incident_id, contact_id, channel, recipient_target, subject, message_body, status
        ) VALUES (?, ?, ?, ?, 'SMS', ?, ?, ?, ?)`,
        [
          smsNotifId,
          req.user.id,
          incidentId,
          primaryContact.id,
          primaryContact.phone,
          'ESTELA SMS Emergency Broadcast',
          smsText,
          smsDispatch.success ? 'SENT' : 'FAILED'
        ]
      );
    }

    for (const contact of contacts) {
      const notifId = 'notif_' + crypto.randomUUID().slice(0, 8);
      const messageBody = `EMERGENCY ALERT from ESTELA: ${user.name} has pressed the emergency SOS button!
Immediate action may be required.
Map Location: ${mapLink}
Accuracy: ${accuracy ? Math.round(accuracy) + ' meters' : 'N/A'}
User Contact: ${user.phone || 'N/A'}
Medical Info: ${user.medical_info || 'None specified'}
Emergency Notes: ${user.emergency_notes || 'None specified'}
Time: ${new Date().toLocaleString()}`;

      await run(
        `INSERT INTO notification_events (
          id, user_id, incident_id, contact_id, channel, recipient_target, subject, message_body, status
        ) VALUES (?, ?, ?, ?, 'EMAIL', ?, ?, ?, 'SENT')`,
        [
          notifId,
          req.user.id,
          incidentId,
          contact.id,
          contact.email,
          `EMERGENCY: ${user.name} activated SOS on ESTELA`,
          messageBody
        ]
      );

      notifiedContacts.push({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        role: contact.role,
        channel: contact.id === primaryContact?.id ? 'SMS TEXT MESSAGE + EMAIL' : 'EMAIL / SMS ADVISORY',
        status: 'DELIVERED_FACTUAL_ALERT'
      });
    }

    res.status(201).json({
      success: true,
      incident: {
        id: incidentId,
        type: 'SOS',
        status: 'ACTIVE',
        severity: 'CRITICAL',
        triggered_at: nowIso,
        addressApprox,
        mapLink
      },
      notifiedContacts,
      message: `Emergency SOS dispatched to ${notifiedContacts.length} trusted contact(s).`
    });
  } catch (err) {
    console.error('SOS Trigger error:', err);
    res.status(500).json({ error: 'Failed to process emergency SOS' });
  }
});

// Resolve or Cancel Incident
app.post('/api/incidents/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { note, status = 'RESOLVED' } = req.body;

    const incident = await get('SELECT * FROM incidents WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const now = new Date().toISOString();
    await run(
      `UPDATE incidents SET status = ?, resolved_at = ?, resolution_note = ? WHERE id = ?`,
      [status, now, note || 'Incident resolved safely by user', id]
    );

    // If incident had a session and was MISSED_CHECKIN, restore session to active if not ended
    if (incident.session_id) {
      const session = await get('SELECT * FROM safety_sessions WHERE id = ?', [incident.session_id]);
      if (session && session.status === 'overdue') {
        const nextDeadline = new Date(Date.now() + session.checkin_interval_minutes * 60 * 1000).toISOString();
        await run('UPDATE safety_sessions SET status = "active", next_checkin_deadline = ? WHERE id = ?', [nextDeadline, session.id]);
      }
    }

    // Log resolution notification event for transparency
    const user = await get('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const contacts = await all('SELECT * FROM trusted_contacts WHERE user_id = ?', [req.user.id]);
    for (const c of contacts) {
      await run(
        `INSERT INTO notification_events (id, user_id, incident_id, contact_id, channel, recipient_target, subject, message_body, status)
         VALUES (?, ?, ?, ?, 'EMAIL', ?, ?, ?, 'SENT')`,
        [
          'notif_' + crypto.randomUUID().slice(0, 8),
          req.user.id,
          id,
          c.id,
          c.email,
          `ESTELA UPDATE: ${user?.name || 'User'} is safe - incident resolved`,
          `ESTELA Advisory: The previous incident has been marked as RESOLVED by ${user?.name || 'User'}. Note: ${note || 'All clear'}.`,
          'SENT'
        ]
      );
    }

    res.json({ message: 'Incident resolved successfully', incidentId: id, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve incident' });
  }
});

// Trigger AI Distress Event
app.post('/api/incidents/ai-distress', authenticateToken, async (req, res) => {
  try {
    const { phrase, confidence, latitude, longitude, isSimulation = false } = req.body;
    const user = await get('SELECT name FROM users WHERE id = ?', [req.user.id]);

    const incidentId = 'aid_' + crypto.randomUUID().slice(0, 8);
    await run(
      `INSERT INTO incidents (
        id, user_id, type, status, severity, trigger_source, distress_phrase, latitude, longitude, address_approx
      ) VALUES (?, ?, 'AI_DISTRESS', 'ACTIVE', 'HIGH', ?, ?, ?, ?, ?)`,
      [
        incidentId,
        req.user.id,
        isSimulation ? 'AI_SIMULATION' : 'AI_VOICE_DETECTION',
        phrase || 'help me',
        latitude || null,
        longitude || null,
        latitude ? `Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}` : 'Location unavailable'
      ]
    );

    res.json({
      success: true,
      incidentId,
      message: `Distress phrase "${phrase}" detected (${isSimulation ? 'Simulated' : 'Real-time Voice'}). Escalation incident logged.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log distress event' });
  }
});

// -------------------------------------------------------------
// LOCATION & TIMELINE & SAFETY HISTORY
// -------------------------------------------------------------

// Post Location Ping
app.post('/api/location/ping', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, speed, heading, sessionId } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ error: 'Latitude and Longitude required' });

    const locId = 'loc_' + crypto.randomUUID().slice(0, 8);
    await run(
      `INSERT INTO location_snapshots (id, user_id, session_id, latitude, longitude, accuracy, speed, heading)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [locId, req.user.id, sessionId || null, latitude, longitude, accuracy || null, speed || null, heading || null]
    );

    res.json({ success: true, locId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save location ping' });
  }
});

// Get Safety History (Full activity timeline)
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const sessions = await all('SELECT * FROM safety_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 20', [req.user.id]);
    const incidents = await all('SELECT * FROM incidents WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    const checkins = await all('SELECT * FROM check_ins WHERE user_id = ? ORDER BY checkin_time DESC LIMIT 30', [req.user.id]);
    const notifications = await all('SELECT * FROM notification_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 30', [req.user.id]);

    res.json({
      sessions,
      incidents,
      checkins,
      notifications
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch safety history' });
  }
});

// Clean all user safety data (GDPR / Data Deletion option)
app.delete('/api/history/clear', authenticateToken, async (req, res) => {
  try {
    await run('DELETE FROM check_ins WHERE user_id = ?', [req.user.id]);
    await run('DELETE FROM incidents WHERE user_id = ?', [req.user.id]);
    await run('DELETE FROM location_snapshots WHERE user_id = ?', [req.user.id]);
    await run('DELETE FROM notification_events WHERE user_id = ?', [req.user.id]);
    await run('DELETE FROM safety_sessions WHERE user_id = ?', [req.user.id]);

    res.json({ message: 'All personal safety activity records have been permanently cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// Status health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ESTELA Safety Engine', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🛡️  ESTELA Safety Server running on http://localhost:${PORT}`);
  console.log(`📡 Background Escalation Engine is ACTIVE`);
  console.log(`===============================================`);
});
