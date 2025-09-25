const axios = require('./node_modules/axios');

async function testRegistration() {
  try {
    console.log('🧪 Testing registration endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      mobile: '1234567890'
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Registration failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testRegistration();
