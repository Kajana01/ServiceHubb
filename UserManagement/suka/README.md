# ServiceHub - Service Booking Platform

A comprehensive service booking platform built with React.js and Node.js/Express.js, featuring user management, service booking, inventory management, and feedback system.

## 🚀 Features

### Core Functionality
- **User Authentication**: Login/Register with role-based access (Admin, Technician, House Owner)
- **Service Management**: Create, edit, delete services with categories and pricing
- **Booking System**: Book services with scheduling, payment methods, and inventory selection
- **Inventory Management**: Track materials and supplies with edit/delete capabilities
- **Feedback System**: Rate services and provide feedback with admin management
- **Notification System**: Real-time notifications for bookings and updates

### User Roles
- **Admin**: Full system access, service management, user management, feedback moderation
- **Technician**: View assigned bookings, update status, access inventory
- **House Owner**: Book services, view bookings, provide feedback

## 🛠️ Technology Stack

### Frontend
- **React.js** - UI framework
- **React Router DOM** - Navigation
- **React Hook Form** - Form management
- **Axios** - HTTP requests
- **React Icons** - Icon library
- **React Hot Toast** - Notifications
- **Tailwind CSS** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Socket.IO** - Real-time communication
- **Twilio** - SMS notifications

## 📁 Project Structure

```
suka/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── config/         # Configuration files
│   └── public/             # Static assets
├── server/                 # Node.js backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   └── scripts/            # Database seeding scripts
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Twilio account (for SMS)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd suka
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cd server
   cp env.example .env
   
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB
   # Run seeding scripts (optional)
   cd server/scripts
   node seedAllData.js
   ```

5. **Start the application**
   ```bash
   # Start server (from server directory)
   npm start
   
   # Start client (from client directory)
   npm start
   ```

## 🔧 Configuration

### Environment Variables (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/servicehub
JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## 📱 Usage

### Admin Features
- **Service Management**: Create, edit, delete services
- **User Management**: View and manage users
- **Booking Management**: Accept/reject bookings, assign technicians
- **Inventory Management**: Add, edit, delete materials
- **Feedback Management**: Moderate feedback and respond to users

### Technician Features
- **View Assignments**: See assigned bookings
- **Update Status**: Mark bookings as in-progress/completed
- **Access Inventory**: View available materials

### House Owner Features
- **Browse Services**: View available services
- **Book Services**: Schedule services with payment and inventory selection
- **View Bookings**: Track booking status
- **Provide Feedback**: Rate completed services

## 🔐 Authentication

The system uses JWT-based authentication with role-based access control:
- **Admin**: Full system access
- **Technician**: Limited to assigned bookings and inventory
- **House Owner**: Service booking and feedback

## 📊 Database Models

- **User**: User accounts with roles and authentication
- **Service**: Service definitions with categories and pricing
- **Booking**: Service bookings with scheduling and payment
- **Inventory**: Materials and supplies tracking
- **Feedback**: User feedback and ratings
- **Notification**: System notifications

## 🚀 Deployment

### Production Build
```bash
# Build client for production
cd client
npm run build

# Start server in production mode
cd server
NODE_ENV=production npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team.

---

**ServiceHub** - Making service booking simple and efficient! 🏠🔧