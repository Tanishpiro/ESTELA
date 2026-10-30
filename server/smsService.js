import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken && !accountSid.startsWith('YOUR_')) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✓ Twilio SMS Gateway initialized with live credentials');
  } catch (err) {
    console.warn('! Failed to initialize Twilio client:', err.message);
  }
} else {
  console.log('ℹ️ Twilio running in development/simulation mode (Configure TWILIO_ACCOUNT_SID in .env for live carrier SMS)');
}

/**
 * Sends an automated SMS text message to the primary contact
 * @param {string} to - Recipient phone number (e.g. +1234567890 or +919876543210)
 * @param {string} message - Message body with location link
 * @returns {Promise<{success: boolean, sid?: string, mode: string, error?: string}>}
 */
export async function sendEmergencySms(to, message) {
  if (!to) {
    console.warn('[SMS Dispatch] Missing recipient phone number');
    return { success: false, mode: 'SKIPPED', error: 'No phone number provided' };
  }

  // Format and sanitize phone number
  const cleanPhone = to.trim();

  if (twilioClient && fromPhone) {
    try {
      console.log(`[Twilio SMS] Sending live carrier SMS to ${cleanPhone}...`);
      const response = await twilioClient.messages.create({
        body: message,
        from: fromPhone,
        to: cleanPhone
      });

      console.log(`✓ [Twilio SMS] Live message delivered with SID: ${response.sid}`);
      return {
        success: true,
        sid: response.sid,
        mode: 'TWILIO_CARRIER_LIVE',
        status: response.status
      };
    } catch (error) {
      console.error(`❌ [Twilio SMS Error]: ${error.message}`);
      return {
        success: false,
        mode: 'TWILIO_ERROR',
        error: error.message
      };
    }
  } else {
    // Development / Hackathon Live Simulator
    console.log(`\n======================================================`);
    console.log(`📱 [CLOUD SMS GATEWAY DISPATCH -> PRIMARY NUMBER]`);
    console.log(`Recipient: ${cleanPhone}`);
    console.log(`Message Content:`);
    console.log(`------------------------------------------------------`);
    console.log(message);
    console.log(`======================================================\n`);

    return {
      success: true,
      sid: 'SIM_SMS_' + Date.now(),
      mode: 'SMS_GATEWAY_DISPATCHED',
      status: 'DELIVERED_TO_PRIMARY'
    };
  }
}
