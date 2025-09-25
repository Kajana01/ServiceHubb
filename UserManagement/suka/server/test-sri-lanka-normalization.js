const axios = require('axios');

async function testSriLankanNormalization() {
  console.log('🇱🇰 Testing Sri Lankan Mobile Number Normalization...');
  
  const testCases = [
    '+94771234567',  // International format
    '0771234567',    // Local format
    '+94 77 123 4567', // With spaces
    '077 123 4567',  // Local with spaces
    '+94-77-123-4567' // With dashes
  ];
  
  for (const mobile of testCases) {
    try {
      console.log(`\n📱 Testing: ${mobile}`);
      
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        mobile: mobile
      });
      
      console.log('✅ Success!');
      console.log('📱 Normalized Mobile:', response.data.user.mobile);
      console.log('🔐 Verification Code:', response.data.verificationCodes.mobile);
      
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('❌ Validation Error:', error.response.data.message);
      } else {
        console.log('❌ Error:', error.message);
      }
    }
  }
}

testSriLankanNormalization();






