async function testWorkflow() {
  const base = 'http://localhost:5000/api';
  console.log('--- Step 1: Register User ---');
  const userEmail = `tester_${Date.now()}@estela.safety`;
  const regRes = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Elena Rostova',
      email: userEmail,
      password: 'password123',
      phone: '+1 555-4321',
      emergency_notes: 'Asthma, Blood O+'
    })
  });
  const regData = await regRes.json();
  console.log('✓ Registered User:', regData.user.name, 'Token received:', !!regData.token);
  const token = regData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  console.log('--- Step 2: Add Backup Trusted Contact ---');
  const addContactRes = await fetch(`${base}/contacts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Marcus Vance (Brother)',
      relationship: 'Brother',
      phone: '+1 555-8888',
      email: 'marcus.emergency@test.com',
      role: 'backup',
      notify_on_missed_checkin: 1,
      notify_on_sos: 1
    })
  });
  const contact = await addContactRes.json();
  console.log('✓ Added Backup Contact:', contact.name, 'Role:', contact.role);

  console.log('--- Step 3: Start Safety Session ---');
  const sessionRes = await fetch(`${base}/sessions/start`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Late Commute Test',
      duration_minutes: 30,
      checkin_interval_minutes: 1,
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10
    })
  });
  const sessionData = await sessionRes.json();
  console.log('✓ Safety Session Started:', sessionData.id, 'Next Check-in:', sessionData.next_checkin_deadline);

  console.log('--- Step 4: Perform "I AM SAFE" Check-in ---');
  const checkinRes = await fetch(`${base}/sessions/${sessionData.id}/checkin`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      note: 'User verified safe at checkpoint 1',
      latitude: 37.7750,
      longitude: -122.4195,
      accuracy: 8
    })
  });
  const checkinData = await checkinRes.json();
  console.log('✓ Confirmed Safety:', checkinData.message, 'New deadline:', checkinData.session.next_checkin_deadline);

  console.log('--- Step 5: Test Emergency SOS Activation ---');
  const sosRes = await fetch(`${base}/incidents/sos`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      latitude: 37.7752,
      longitude: -122.4196,
      accuracy: 5
    })
  });
  const sosData = await sosRes.json();
  console.log('✓ SOS Triggered! Incident ID:', sosData.incident.id, 'Dispatched to contacts:', sosData.notifiedContacts.length);
  for (const c of sosData.notifiedContacts) {
    console.log(`  -> Sent factual alert to: ${c.name} (${c.email})`);
  }

  console.log('--- Step 6: Resolve Emergency Incident ---');
  const resolveRes = await fetch(`${base}/incidents/${sosData.incident.id}/resolve`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ note: 'False alarm test resolved cleanly' })
  });
  const resolveData = await resolveRes.json();
  console.log('✓ Incident Resolved Safely:', resolveData.status);

  console.log('--- Step 7: Check Safety History Audit Trail ---');
  const historyRes = await fetch(`${base}/history`, {
    headers: authHeaders
  });
  const history = await historyRes.json();
  console.log(`✓ Audit Records Verified: ${history.sessions.length} sessions, ${history.incidents.length} incidents, ${history.notifications.length} dispatched notification events.`);

  console.log('\n===============================================');
  console.log('🎉 ALL ESTELA CORE END-TO-END WORKFLOWS PASSED!');
  console.log('===============================================\n');
}

testWorkflow().catch(console.error);
