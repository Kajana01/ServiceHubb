import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaSpinner, FaMobile, FaArrowLeft, FaRedo } from 'react-icons/fa';

const Login = () => {
  const { login, verifyLogin, resendLoginCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(resendTimer => resendTimer - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      console.log('Login result:', result);
      if (result.success) {
        if (result.requiresVerification) {
          setPendingUser(result.user);
          setShowVerification(true);
          setResendTimer(60); // Start 60-second countdown
        } else {
          // Go directly to dashboard after successful login
          console.log('Navigating to:', from);
          // Use a more reliable redirect method
          setTimeout(() => {
            console.log('Attempting redirect...');
            window.location.href = from;
          }, 200);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifySubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await verifyLogin(pendingUser.email, data.verificationCode);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowVerification(false);
    setPendingUser(null);
    setResendTimer(0);
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || isResending) return;
    
    setIsResending(true);
    try {
      const result = await resendLoginCode(pendingUser.email);
      if (result.success) {
        setResendTimer(60); // Reset timer to 60 seconds
      }
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            {showVerification ? (
              <FaMobile className="w-8 h-8 text-white" />
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {showVerification ? 'Verify Your Mobile' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {showVerification 
              ? `Enter the verification code sent to ${pendingUser?.mobile}`
              : 'Sign in to your ServiceHub account'
            }
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          {showVerification ? (
            <form onSubmit={handleSubmit(onVerifySubmit)} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex items-center text-primary-600 hover:text-primary-500 mb-4"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </button>

              {/* Verification Code Field */}
              <div className="form-group">
                <label htmlFor="verificationCode" className="form-label">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMobile  className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="verificationCode"
                    type="text"
                    {...register('verificationCode', {
                      required: 'Verification code is required',
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: 'Verification code must be 6 digits'
                      }
                    })}
                    className="input pl-10"
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                  />
                </div>
                {errors.verificationCode && (
                  <p className="form-error">{errors.verificationCode.message}</p>
                )}
              </div>

                              {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner  className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </button>

                {/* Resend Code Section */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendTimer > 0 || isResending}
                    className={`text-sm font-medium flex items-center justify-center mx-auto ${
                      resendTimer > 0 || isResending
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-primary-600 hover:text-primary-500'
                    }`}
                  >
                    {isResending ? (
                      <>
                        <FaSpinner  className="animate-spin mr-2 h-4 w-4" />
                        Sending...
                      </>
                    ) : resendTimer > 0 ? (
                      `Resend in ${resendTimer}s`
                    ) : (
                      <>
                        <FaRedo className="mr-2 h-4 w-4" />
                        Resend Code
                      </>
                    )}
                  </button>
                </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="input pl-10"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required'
                    })}
                    className="input pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {!showVerification && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;