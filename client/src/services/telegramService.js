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
  chatId = DEFAULT_CHAT_ID,
  alertTimestamp
}) {
  const targetChatId = chatId || DEFAULT_CHAT_ID;
  const lat = latitude || 28.4788;
  const lon = longitude || 76.9128;
  const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString();
  const alertId = alertTimestamp || Date.now();

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
              { text: '✅ I Accept Responsibility', callback_data: `ack_accept_${alertId}` },
              { text: '❌ Reject / Unable To Respond', callback_data: `ack_reject_${alertId}` }
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
export async function processGuardianAcknowledgment(incidentTimestamp) {
  if (!incidentTimestamp) return null;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) return null;

    // Filter callback queries matching THIS SPECIFIC alert's timestamp
    const matchingCallbacks = data.result
      .filter(u => u.callback_query && u.callback_query.data)
      .filter(u => u.callback_query.data.includes(String(incidentTimestamp)));

    if (matchingCallbacks.length === 0) {
      // No parent has clicked the button for THIS specific incident yet!
      return null;
    }

    const latest = matchingCallbacks[matchingCallbacks.length - 1].callback_query;
    const isAccepted = latest.data.includes('accept');
    const isRejected = latest.data.includes('reject');

    // Answer callback query
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
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error processing guardian acknowledgment:', err);
    return null;
  }
}
