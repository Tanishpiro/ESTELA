import crypto from 'crypto';
import { run, all, get } from './database.js';

class EscalationEngine {
  constructor() {
    this.intervalId = null;
    this.isProcessing = false;
    this.checkIntervalMs = 5000; // Check every 5 seconds for precision
  }

  start() {
    if (this.intervalId) return;
    console.log('[Escalation Engine] Starting persistent background escalation worker...');
    this.intervalId = setInterval(() => this.processOverdueSessions(), this.checkIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Escalation Engine] Worker stopped');
    }
  }

  async processOverdueSessions() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const nowIso = new Date().toISOString();

      // Query active sessions where the next_checkin_deadline has passed
      const overdueSessions = await all(
        `SELECT s.*, u.name as user_name, u.phone as user_phone, u.emergency_notes
         FROM safety_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.status = 'active' AND datetime(s.next_checkin_deadline) <= datetime(?)`,
        [nowIso]
      );

      for (const session of overdueSessions) {
        await this.handleOverdueSession(session);
      }

      // Check active MISSED_CHECKIN incidents to check if escalation to backup contact is required
      await this.processBackupEscalations();

    } catch (err) {
      console.error('[Escalation Engine] Error processing cycles:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  async handleOverdueSession(session) {
    console.log(`[Escalation Engine] Session ${session.id} for user ${session.user_name} is OVERDUE!`);

    // 1. Transition session state to 'overdue'
    await run(
      `UPDATE safety_sessions SET status = 'overdue' WHERE id = ?`,
      [session.id]
    );

    // 2. Fetch latest known location snapshot if available
    const latestLoc = await get(
      `SELECT * FROM location_snapshots WHERE session_id = ? ORDER BY recorded_at DESC LIMIT 1`,
      [session.id]
    );

    // 3. Create an incident record for MISSED_CHECKIN
    const incidentId = 'inc_' + crypto.randomUUID().slice(0, 8);
    await run(
      `INSERT INTO incidents (
        id, user_id, session_id, type, status, severity, trigger_source,
        latitude, longitude, accuracy, address_approx
      ) VALUES (?, ?, ?, 'MISSED_CHECKIN', 'ACTIVE', 'HIGH', 'ESCALATION_ENGINE', ?, ?, ?, ?)`,
      [
        incidentId,
        session.user_id,
        session.id,
        latestLoc ? latestLoc.latitude : null,
        latestLoc ? latestLoc.longitude : null,
        latestLoc ? latestLoc.accuracy : null,
        latestLoc ? `Near Lat ${latestLoc.latitude.toFixed(4)}, Lon ${latestLoc.longitude.toFixed(4)}` : 'Location unavailable'
      ]
    );

    // 4. Log Missed Check-in event
    const checkinId = 'chk_' + crypto.randomUUID().slice(0, 8);
    await run(
      `INSERT INTO check_ins (id, session_id, user_id, status, note, latitude, longitude)
       VALUES (?, ?, ?, 'missed', 'System recorded missed check-in deadline', ?, ?)`,
      [checkinId, session.id, session.user_id, latestLoc?.latitude || null, latestLoc?.longitude || null]
    );

    // 5. Notify Primary Contact with factual alert
    let primaryContact = null;
    if (session.primary_contact_id) {
      primaryContact = await get(`SELECT * FROM trusted_contacts WHERE id = ?`, [session.primary_contact_id]);
    }
    if (!primaryContact) {
      // Fallback to any primary contact marked for user
      primaryContact = await get(`SELECT * FROM trusted_contacts WHERE user_id = ? AND role = 'primary' LIMIT 1`, [session.user_id]);
    }
    if (!primaryContact) {
      primaryContact = await get(`SELECT * FROM trusted_contacts WHERE user_id = ? LIMIT 1`, [session.user_id]);
    }

    if (primaryContact) {
      const mapLink = latestLoc 
        ? `https://www.openstreetmap.org/?mlat=${latestLoc.latitude}&mlon=${latestLoc.longitude}#map=16/${latestLoc.latitude}/${latestLoc.longitude}`
        : 'Not shared';

      const message = `ESTELA ADVISORY: ${session.user_name} did not check in at their scheduled deadline for session "${session.title}".
Note: This is a factual check-in alert, not a confirmed emergency.
Last Known Location: ${mapLink}
Emergency Notes: ${session.emergency_notes || 'None provided'}
Please attempt to reach ${session.user_name} at ${session.user_phone || 'their phone'}.`;

      const notificationId = 'notif_' + crypto.randomUUID().slice(0, 8);
      await run(
        `INSERT INTO notification_events (
          id, user_id, incident_id, contact_id, channel, recipient_target, subject, message_body, status
        ) VALUES (?, ?, ?, ?, 'EMAIL', ?, ?, ?, 'SENT')`,
        [
          notificationId,
          session.user_id,
          incidentId,
          primaryContact.id,
          primaryContact.email,
          `ESTELA Alert: Missed Check-in by ${session.user_name}`,
          message
        ]
      );

      console.log(`[Escalation Engine] Dispatched primary missed check-in alert to ${primaryContact.name} (${primaryContact.email})`);
    } else {
      console.warn(`[Escalation Engine] User ${session.user_name} has no configured trusted contacts.`);
    }
  }

  async processBackupEscalations() {
    // If an incident has been ACTIVE for more than 3 minutes without user checkin or resolution,
    // escalate to the backup contact if not already notified.
    const escalationThresholdMinutes = 1; // 1 minute in dev mode for responsive testability
    const thresholdIso = new Date(Date.now() - escalationThresholdMinutes * 60 * 1000).toISOString();

    const unacknowledgedIncidents = await all(
      `SELECT i.*, u.name as user_name, u.phone as user_phone, s.backup_contact_id
       FROM incidents i
       JOIN users u ON i.user_id = u.id
       LEFT JOIN safety_sessions s ON i.session_id = s.id
       WHERE i.status = 'ACTIVE' AND datetime(i.created_at) <= datetime(?)`,
      [thresholdIso]
    );

    for (const incident of unacknowledgedIncidents) {
      // Check if backup has already been notified
      const alreadyNotifiedBackup = await get(
        `SELECT id FROM notification_events 
         WHERE incident_id = ? AND message_body LIKE '%BACKUP ESCALATION%'`,
        [incident.id]
      );

      if (!alreadyNotifiedBackup) {
        // Find backup contact
        let backupContact = null;
        if (incident.backup_contact_id) {
          backupContact = await get(`SELECT * FROM trusted_contacts WHERE id = ?`, [incident.backup_contact_id]);
        }
        if (!backupContact) {
          backupContact = await get(`SELECT * FROM trusted_contacts WHERE user_id = ? AND role = 'backup' LIMIT 1`, [incident.user_id]);
        }

        if (backupContact) {
          const mapLink = incident.latitude 
            ? `https://www.openstreetmap.org/?mlat=${incident.latitude}&mlon=${incident.longitude}#map=16/${incident.latitude}/${incident.longitude}`
            : 'Not available';

          const backupMsg = `[BACKUP ESCALATION] ESTELA ADVISORY: Primary contact did not acknowledge missed check-in for ${incident.user_name}.
Incident ID: ${incident.id}
Status: ACTIVE OVERDUE
Last Known Location: ${mapLink}
Please check in on ${incident.user_name}.`;

          const notificationId = 'notif_' + crypto.randomUUID().slice(0, 8);
          await run(
            `INSERT INTO notification_events (
              id, user_id, incident_id, contact_id, channel, recipient_target, subject, message_body, status
            ) VALUES (?, ?, ?, ?, 'EMAIL', ?, ?, ?, 'SENT')`,
            [
              notificationId,
              incident.user_id,
              incident.id,
              backupContact.id,
              backupContact.email,
              `ESTELA BACKUP ESCALATION: Urgent follow-up for ${incident.user_name}`,
              backupMsg
            ]
          );

          console.log(`[Escalation Engine] Secondary backup escalation sent to ${backupContact.name} (${backupContact.email})`);
        }
      }
    }
  }
}

export const escalationEngine = new EscalationEngine();
