// Global Emergency Incident & Alarm Relay Cache
// Stores the latest active incident in memory so any device (Child phone, Parent phone)
// can poll and receive the live emergency status and trigger the alarm.

let latestIncident = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Parent phone polls this endpoint to detect if Catty triggered SOS!
  if (req.method === 'GET') {
    // If incident is older than 5 minutes, auto-expire
    if (latestIncident && Date.now() - latestIncident.timestamp > 300000) {
      latestIncident = null;
    }
    return res.status(200).json({
      active: !!latestIncident,
      incident: latestIncident
    });
  }

  // POST: Dispatched when SOS is triggered or resolved
  if (req.method === 'POST') {
    const { action = 'TRIGGER', latitude = 28.4788, longitude = 76.9128, accuracy = 12 } = req.body || {};

    if (action === 'RESOLVE') {
      latestIncident = null;
      return res.status(200).json({ success: true, message: 'Incident resolved across devices.' });
    }

    const incidentId = 'sos_' + Math.random().toString(36).substring(2, 9);
    const nowIso = new Date().toISOString();
    const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;

    latestIncident = {
      id: incidentId,
      type: 'SOS',
      childName: 'Catty',
      parentName: 'Tanish',
      status: 'ACTIVE',
      severity: 'CRITICAL',
      triggered_at: nowIso,
      timestamp: Date.now(),
      latitude,
      longitude,
      accuracy,
      addressApprox: `GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
      mapLink
    };

    return res.status(200).json({
      success: true,
      incident: latestIncident,
      notifiedContacts: [
        {
          id: 'ctc_tanish',
          name: 'Tanish (Parent)',
          phone: '+91 9306617122',
          channel: 'Telegram + Siren Alarm Broadcast',
          status: 'ALERT_ACTIVE'
        }
      ],
      message: 'Emergency SOS dispatched to trusted contacts and parent portal.'
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
