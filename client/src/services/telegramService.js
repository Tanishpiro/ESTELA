// Telegram Emergency Alert Dispatch Service with Guardian Responsibility Acknowledgment
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
Please tap below to confirm whether you are taking immediate responsibility for this emergency alert.`;

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
              { text: '❌ Unable To Respond', callback_data: `ack_decline_${Date.now()}` }
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

// Function to poll or check guardian acknowledgment responses from Telegram
export async function getGuardianAcknowledgmentStatus() {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-10`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return null;

    // Look for recent callback queries (buttons clicked by parent)
    const callbacks = data.result
      .filter(u => u.callback_query)
      .map(u => ({
        id: u.callback_query.id,
        from: u.callback_query.from,
        data: u.callback_query.data,
        accepted: u.callback_query.data?.startsWith('ack_accept'),
        time: u.callback_query.message?.date ? new Date(u.callback_query.message.date * 1000) : new Date()
      }));

    if (callbacks.length > 0) {
      return callbacks[callbacks.length - 1]; // latest acknowledgment
    }
    return null;
  } catch {
    return null;
  }
}
