const twilio = require('twilio');

class SMSService {
  constructor() {
    // Debug: Log environment variables
    console.log('\n' + '='.repeat(60));
    console.log('🔍 SMS SERVICE DEBUG INFO');
    console.log('='.repeat(60));
    console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ SET' : '❌ NOT SET');
    console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ SET' : '❌ NOT SET');
    console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? '✅ SET' : '❌ NOT SET');
    console.log('='.repeat(60) + '\n');
    
    // Only create Twilio client if credentials are provided
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log('✅ Twilio client created successfully');
    } else {
      console.log('❌ Twilio client not created - missing credentials');
    }
  }

  // Send verification SMS
  async sendVerificationSMS(phoneNumber, verificationCode) {
    console.log('\n' + '='.repeat(60));
    console.log('📱 SENDING VERIFICATION SMS');
    console.log('='.repeat(60));
    console.log(`📱 Phone Number: ${phoneNumber}`);
    console.log(`🔐 Verification Code: ${verificationCode}`);
    console.log(`🔑 Twilio Client: ${this.client ? '✅ READY' : '❌ NOT READY'}`);
    console.log('='.repeat(60));
    
    // Check if SMS service is configured
    if (!this.client) {
      console.log('❌ SMS SERVICE NOT CONFIGURED');
      console.log('💡 To enable real SMS, configure Twilio credentials in .env file');
      console.log('='.repeat(60) + '\n');
      return true; // Return true to avoid blocking registration
    }

    // For development/testing - show verification code in console
    console.log('\n' + '🔑' + '='.repeat(58) + '🔑');
    console.log('🔑 SRI LANKAN VERIFICATION CODE FOR TESTING:');
    console.log('🔑' + '='.repeat(58) + '🔑');
    console.log(`📱 Sri Lankan Mobile: ${phoneNumber}`);
    console.log(`🔐 Verification Code: ${verificationCode}`);
    console.log('🇱🇰 ServiceHub Sri Lanka - Use this code to verify your mobile number');
    console.log('🔑' + '='.repeat(58) + '🔑');
    console.log('🔑 COPY THIS CODE: ' + verificationCode + ' 🔑');
    console.log('🔑' + '='.repeat(58) + '🔑\n');

    try {
      console.log('🚀 Attempting to send SMS via Twilio...');
      console.log(`📤 From: ${process.env.TWILIO_PHONE_NUMBER}`);
      console.log(`📥 To: ${phoneNumber}`);
      
      const message = await this.client.messages.create({
        body: `Your Sri Lankan Service Booking App verification code is: ${verificationCode}. Valid for 10 minutes. - ServiceHub Sri Lanka`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('✅ SMS sent successfully!');
      console.log(`📱 Message SID: ${message.sid}`);
      console.log(`💰 Cost: ${message.price || 'N/A'}`);
      console.log('='.repeat(60) + '\n');
      return true;
    } catch (error) {
      console.error('❌ SMS sending error:', error);
      console.error('🔍 Error details:', error.message);
      console.error('📋 Error code:', error.code);
      console.log('\n' + '🔑' + '='.repeat(58) + '🔑');
      console.log('🔑 SRI LANKAN VERIFICATION CODE (SMS failed, use this code):');
      console.log('🔑' + '='.repeat(58) + '🔑');
      console.log(`📱 Sri Lankan Mobile: ${phoneNumber}`);
      console.log(`🔐 Verification Code: ${verificationCode}`);
      console.log('🇱🇰 ServiceHub Sri Lanka - Use this code to verify your mobile number');
      console.log('🔑' + '='.repeat(58) + '🔑');
      console.log('🔑 COPY THIS CODE: ' + verificationCode + ' 🔑');
      console.log('🔑' + '='.repeat(58) + '🔑\n');
      return true; // Return true so registration doesn't fail
    }
  }

  // Send booking notification SMS
  async sendBookingNotificationSMS(phoneNumber, message) {
    try {
      const smsMessage = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('SMS sent successfully:', smsMessage.sid);
      return true;
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }

  // Send technician assignment SMS
  async sendTechnicianAssignmentSMS(phoneNumber, bookingDetails) {
    const message = `Your service booking has been assigned to a technician. Service: ${bookingDetails.serviceName}, Date: ${new Date(bookingDetails.scheduledDate).toLocaleDateString()}, Time: ${bookingDetails.scheduledTime}. You'll receive a call from the technician soon.`;
    
    try {
      const smsMessage = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('Technician assignment SMS sent successfully:', smsMessage.sid);
      return true;
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }

  // Send service completion SMS
  async sendServiceCompletionSMS(phoneNumber, bookingDetails) {
    const message = `Your service has been completed successfully! Service: ${bookingDetails.serviceName}. Please provide your feedback and rating in the app. Thank you for choosing our services!`;
    
    try {
      const smsMessage = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('Service completion SMS sent successfully:', smsMessage.sid);
      return true;
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }

  // Send reminder SMS
  async sendReminderSMS(phoneNumber, bookingDetails) {
    const message = `Reminder: You have a service scheduled for tomorrow. Service: ${bookingDetails.serviceName}, Date: ${new Date(bookingDetails.scheduledDate).toLocaleDateString()}, Time: ${bookingDetails.scheduledTime}. Please ensure someone is available at the address.`;
    
    try {
      const smsMessage = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('Reminder SMS sent successfully:', smsMessage.sid);
      return true;
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }
}

module.exports = new SMSService();
