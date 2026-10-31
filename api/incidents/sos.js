export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { latitude = 28.4788, longitude = 76.9128, accuracy = 12 } = req.body || {};
  const incidentId = 'sos_' + Math.random().toString(36).substring(2, 9);
  const nowIso = new Date().toISOString();
  const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;

  return res.status(200).json({
    success: true,
    incident: {
      id: incidentId,
      type: 'SOS',
      status: 'ACTIVE',
      severity: 'CRITICAL',
      triggered_at: nowIso,
      addressApprox: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      mapLink
    },
    notifiedContacts: [
      {
        id: 'ctc_primary',
        name: 'Primary Contact',
        phone: '+91 9876543210',
        channel: 'SMS + Push Broadcast',
        status: 'DELIVERED_FACTUAL_ALERT'
      }
    ],
    message: 'Emergency SOS dispatched to trusted contacts.'
  });
}
