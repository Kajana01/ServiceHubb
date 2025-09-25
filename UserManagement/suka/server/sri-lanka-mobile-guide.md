# Sri Lankan Mobile Number Guide

## 📱 **Sri Lankan Mobile Number Formats**

### **Correct Format:**
- **International Format**: `+94XXXXXXXXX`
- **Local Format**: `0XXXXXXXXX`

### **Examples:**
- `+94771234567` ✅ (International format)
- `0771234567` ✅ (Local format - will be converted to +94)
- `+94 77 123 4567` ✅ (With spaces - will be cleaned)

### **Common Sri Lankan Mobile Operators:**
- **Dialog**: +9477, +9478
- **Mobitel**: +9471, +9472
- **Hutch**: +9470, +9476
- **Airtel**: +9477
- **Etisalat**: +9477

### **How to Use in Your App:**

1. **For Registration:**
   ```json
   {
     "username": "your_username",
     "email": "your_email@example.com",
     "password": "your_password",
     "mobile": "+94771234567"
   }
   ```

2. **Verification Code:**
   - The verification code will be displayed in the server console
   - Use that code to verify your mobile number

### **Testing:**
- Use any valid Sri Lankan mobile number format
- The verification code will appear in the server console
- SMS will be sent if Twilio is properly configured

### **Troubleshooting:**
- Make sure to include the country code (+94)
- Remove any spaces or special characters
- Use 9 digits after +94 (total 12 digits including country code)






