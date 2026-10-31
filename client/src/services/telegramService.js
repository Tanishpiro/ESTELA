// Telegram Emergency Alert Dispatch Service with Real-time Guardian Responsibility Handling
const TELEGRAM_BOT_TOKEN = '9016665127:AAE1kRi0zpATonPJ91j26Ub5_pP3WGX75oA';
const DEFAULT_CHAT_ID = '8971040800';

export async function sendTelegramEmergencyAlert({
  userName = 'ESTELA User',
  phone = '',
  latitude,
  longitude,
  accuracy,
  triggerSource = 'SOS Emergency Button',
  medicalInfo = '',
  chatId = DEFAULT_CHAT_ID
}) {
  const targetChatId = chatId || DEFAULT_CHAT_ID;
  const lat = latitude || 28.4788;
  const lon = longitude || 76.9128;
  const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString();

  const messageText = 
`🚨 *ESTELA EMERGENCY SOS ALERT!* 🚨
━━━━━━━━━━━━━━━━━━━━
👤 *User:* ${userName}
📱 *Phone:* ${phone || 'Not provided'}
📍 *Live Location:* [View on Google Maps](${mapUrl})
🌐 *Coordinates:* \`${lat.toFixed(5)}, ${lon.toFixed(5)}\`
🎯 *GPS Accuracy:* ±${Math.round(accuracy || 10)}m
⚡ *Trigger Source:* ${triggerSource}
⏰ *Time:* ${timeStr} (${dateStr})
${medicalInfo ? `🩺 *Medical Info:* ${medicalInfo}\n` : ''}━━━━━━━━━━━━━━━━━━━━
🛡️ *GUARDIAN RESPONSIBILITY ACTION REQUIRED:*
Please tap an option below to confirm whether you are taking immediate responsibility for this emergency alert.`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageText,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ I Accept Responsibility', callback_data: `ack_accept_${Date.now()}` },
              { text: '❌ Reject / Unable To Respond', callback_data: `ack_reject_${Date.now()}` }
            ]
          ]
        }
      })
    });

    const data = await response.json();
    return {
      success: data.ok,
      messageId: data.result?.message_id,
      error: data.description || null
    };
  } catch (err) {
    console.error('Failed to dispatch Telegram SOS alert:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// Check and process guardian acknowledgment updates from Telegram
export async function processGuardianAcknowledgment(incidentTimestamp = 0) {
  try {
    // Fetch last 10 updates to always get fresh clicks without cache
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-10`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) return null;

    // Filter all callback queries
    const callbacks = data.result.filter(u => u.callback_query);
    if (callbacks.length === 0) return null;

    // Get the latest callback query
    const latestUpdate = callbacks[callbacks.length - 1];
    const latest = latestUpdate.callback_query;
    const isAccepted = latest.data && latest.data.includes('accept');
    const isRejected = latest.data && (latest.data.includes('reject') || latest.data.includes('decline'));

    // Extract timestamp from callback_data (e.g. ack_accept_1793425545477)
    const match = latest.data ? latest.data.match(/_(\d{10,})$/) : null;
    const actionTime = match ? parseInt(match[1], 10) : 0;

    // If this click is older than the current incident trigger, ignore it so it stays fresh!
    if (incidentTimestamp && actionTime && actionTime < (incidentTimestamp - 10000)) {
      return null;
    }

    // Acknowledge the callback immediately on Telegram so spinner stops
    try {
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: latest.id,
          text: isAccepted 
            ? '✅ Responsibility accepted! ESTELA screen updated.' 
            : '⚠️ Marked unable/rejected. ESTELA screen updated.'
        })
      }).catch(() => {});
    } catch (e) {}

    return {
      id: latest.id,
      from: latest.from,
      accepted: isAccepted,
      rejected: isRejected,
      time: actionTime ? new Date(actionTime) : new Date(),
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error processing guardian acknowledgment:', err);
    return null;
  }
}
