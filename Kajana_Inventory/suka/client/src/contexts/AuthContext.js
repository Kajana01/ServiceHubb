import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios defaults
  useEffect(() => {
    // Set base URL for API requests - use relative URLs for same-origin requests
    // axios.defaults.baseURL = 'http://localhost:5000';
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      console.log('Token set in axios headers:', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      console.log('Token removed from axios headers');
    }
  }, [token]);

  // Add axios interceptor for better error handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          console.log('Checking auth with token:', token);
          const response = await axios.get('/api/auth/me');
          console.log('Auth check successful, setting user:', response.data.user);
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          console.error('Error details:', error.response?.data);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        console.log('No token found, setting user to null');
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { requiresVerification, user: userData, token: newToken } = response.data;
      
      if (requiresVerification) {
        // Store user email for verification step
        localStorage.setItem('pendingLoginEmail', email);
        toast.success('Verification code sent to your mobile number');
        return { success: true, requiresVerification: true, user: userData };
      }

      // Set both token and user immediately to avoid race conditions
      console.log('Setting user and token:', { userData, newToken });
      
      // Set token first and ensure axios headers are updated
      setToken(newToken);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Set user state
      setUser(userData);
      
      console.log('User and token set successfully');
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Verify login with mobile code
  const verifyLogin = async (email, verificationCode) => {
    try {
      const response = await axios.post('/api/auth/verify-login', {
        email,
        verificationCode
      });

      const { token: newToken, user: userData } = response.data;
      
      // Clear pending login email
      localStorage.removeItem('pendingLoginEmail');
      
      // Set both token and user immediately to avoid race conditions
      setToken(newToken);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setUser(userData);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Resend login verification code
  const resendLoginCode = async (email) => {
    try {
      await axios.post('/api/auth/resend-login-code', {
        email
      });

      toast.success('Verification code sent to your mobile number');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification code';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token: newToken, user: newUser, verificationCodes } = response.data;
      
      // Store verification codes for display
      if (verificationCodes) {
        localStorage.setItem('verificationCodes', JSON.stringify(verificationCodes));
      }
      
      setToken(newToken);
      setUser(newUser);
      
      toast.success('Registration successful! Please verify your email and mobile number.');
      return { success: true, user: newUser, verificationCodes };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    toast.success('Logged out successfully');
  };

  // Verify email function
  const verifyEmail = async (verificationCode) => {
    try {
      const response = await axios.post('/api/auth/verify-email', { verificationCode });
      setUser(response.data.user);
      toast.success('Email verified successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Verify mobile function
  const verifyMobile = async (verificationCode) => {
    try {
      const response = await axios.post('/api/auth/verify-mobile', { verificationCode });
      setUser(response.data.user);
      toast.success('Mobile verified successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Mobile verification failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Resend verification codes
  const resendVerification = async () => {
    try {
      await axios.post('/api/auth/resend-verification');
      toast.success('Verification codes sent successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend verification codes';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/users/profile', profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      toast.success(response.data.message);
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Update user data (for internal use)
  const updateUser = (userData) => {
    setUser(userData);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is verified
  const isVerified = () => {
    return user?.isEmailVerified && user?.isMobileVerified;
  };

  const value = {
    user,
    loading,
    token,
    login,
    verifyLogin,
    resendLoginCode,
    register,
    logout,
    verifyEmail,
    verifyMobile,
    resendVerification,
    updateProfile,
    changePassword,
    forgotPassword,
    updateUser,
    hasRole,
    isVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
