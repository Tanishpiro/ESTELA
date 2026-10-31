// Telegram Emergency Alert Dispatch Service for Child (Catty) & Guardian (Tanish)
const TELEGRAM_BOT_TOKEN = '9016665127:AAE1kRi0zpATonPJ91j26Ub5_pP3WGX75oA';
const DEFAULT_CHAT_ID = '8971040800';
export const SINGLE_PRIMARY_NUMBER = '+91 9306617122';

export async function sendTelegramEmergencyAlert({
  userName = 'catty',
  childName = 'catty',
  parentName = 'Tanish',
  phone = SINGLE_PRIMARY_NUMBER,
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
`🚨 *ESTELA EMERGENCY CHILD ALERT!* 🚨
━━━━━━━━━━━━━━━━━━━━
👧 *Child:* ${childName || userName || 'catty'}
👨‍👧 *Parent / Guardian:* ${parentName || 'Tanish'}
📱 *Guardian Phone:* ${SINGLE_PRIMARY_NUMBER}
📍 *Child's Live Location:* [View on Google Maps](${mapUrl})
🌐 *Coordinates:* \`${lat.toFixed(5)}, ${lon.toFixed(5)}\`
🎯 *GPS Accuracy:* ±${Math.round(accuracy || 10)}m
⚡ *Trigger Source:* ${triggerSource}
⏰ *Time:* ${timeStr} (${dateStr})
${medicalInfo ? `🩺 *Medical Info:* ${medicalInfo}\n` : ''}━━━━━━━━━━━━━━━━━━━━
🛡️ *PARENT RESPONSIBILITY ACTION REQUIRED:*
Tanish, your child catty has triggered an emergency SOS alert! Please tap below to confirm responsibility.`;

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

// Dispatches a reassuring "I AM SAFE NOW" confirmation message directly to the parent
export async function sendTelegramSafeConfirmation({
  childName = 'catty',
  parentName = 'Tanish',
  latitude,
  longitude,
  chatId = DEFAULT_CHAT_ID
}) {
  const targetChatId = chatId || DEFAULT_CHAT_ID;
  const lat = latitude || 28.4788;
  const lon = longitude || 76.9128;
  const mapUrl = `https://maps.google.com/?q=${lat},${lon}`;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString();

  const safeMessage = 
`✅ *ESTELA SAFETY UPDATE: CATTY IS SAFE NOW!* ✅
━━━━━━━━━━━━━━━━━━━━
👧 *Child:* ${childName || 'catty'}
👨‍👧 *Parent / Guardian:* ${parentName || 'Tanish'}
📱 *Guardian Contact:* ${SINGLE_PRIMARY_NUMBER}
🟢 *Status:* False alarm / Emergency safely resolved
⏰ *Resolved At:* ${timeStr} (${dateStr})
📍 *Current Location:* [View on Google Maps](${mapUrl})
━━━━━━━━━━━━━━━━━━━━
🙏 *Parent Notice (Tanish):* Your child catty has confirmed she is safe and secure. The emergency alert has been officially called off!`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: safeMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    const data = await response.json();
    return {
      success: data.ok,
      messageId: data.result?.message_id
    };
  } catch (err) {
    console.error('Failed to dispatch Telegram Safe Confirmation:', err);
    return { success: false, error: err.message };
  }
}

// Check and process guardian acknowledgment updates from Telegram
export async function processGuardianAcknowledgment(incidentTimestamp) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-10`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) return null;

    const callbacks = data.result.filter(u => u.callback_query && u.callback_query.data);
    if (callbacks.length === 0) return null;

    let matchedCallback = null;
    if (incidentTimestamp) {
      const filtered = callbacks.filter(u => u.callback_query.data.includes(String(incidentTimestamp)));
      if (filtered.length > 0) {
        matchedCallback = filtered[filtered.length - 1].callback_query;
      }
    } else {
      matchedCallback = callbacks[callbacks.length - 1].callback_query;
    }

    if (!matchedCallback) return null;

    const isAccepted = matchedCallback.data.includes('accept');
    const isRejected = matchedCallback.data.includes('reject') || matchedCallback.data.includes('decline');

    try {
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: matchedCallback.id,
          text: isAccepted 
            ? '✅ Tanish, you accepted responsibility for catty!' 
            : '⚠️ Tanish marked unable to respond for catty.'
        })
      }).catch(() => {});
    } catch (e) {}

    return {
      id: matchedCallback.id,
      from: matchedCallback.from,
      accepted: isAccepted,
      rejected: isRejected,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error processing guardian acknowledgment:', err);
    return null;
  }
}
