import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiUser, FiAtSign, FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = formData.password.length >= 6;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-secondary-300/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent-300/30 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="max-w-md w-full space-y-6 relative z-10 animate-scale-in">
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-block p-4 bg-gradient-sunset rounded-3xl shadow-glow-lg animate-glow-pulse">
            <h1 className="text-5xl font-black text-white">InstaTube</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Create your account and start sharing
          </p>
        </div>

        {/* Signup Card */}
        <div className="card p-8 space-y-6 animate-slide-up">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                <FiMail className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark-card-hover border-2 border-gray-200 dark:border-dark-border rounded-2xl focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>

            {/* Full Name Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                <FiUser className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark-card-hover border-2 border-gray-200 dark:border-dark-border rounded-2xl focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>

            {/* Username Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                <FiAtSign className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark-card-hover border-2 border-gray-200 dark:border-dark-border rounded-2xl focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                <FiLock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-dark-card-hover border-2 border-gray-200 dark:border-dark-border rounded-2xl focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="flex items-center gap-2 text-sm animate-slide-down">
                {passwordStrength ? (
                  <>
                    <FiCheck className="w-4 h-4 text-success-500" />
                    <span className="text-success-500 font-medium">Strong password</span>
                  </>
                ) : (
                  <span className="text-gray-500">Password must be at least 6 characters</span>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                <span className="font-bold text-lg">Sign Up</span>
              )}
            </button>
          </form>

          {/* Terms Text */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-primary-500 hover:text-primary-600 font-medium">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary-500 hover:text-primary-600 font-medium">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Login Link Card */}
        <div className="card p-5 text-center animate-slide-up" style={{animationDelay: '0.1s'}}>
          <p className="text-gray-700 dark:text-gray-300">
            Already have an account?{' '}
            <Link to="/login" className="font-bold bg-gradient-sunset bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              Log in
            </Link>
          </p>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="text-center p-4 card-flat">
            <div className="text-2xl mb-1">📸</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Share Photos</p>
          </div>
          <div className="text-center p-4 card-flat">
            <div className="text-2xl mb-1">🎬</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Create Reels</p>
          </div>
          <div className="text-center p-4 card-flat">
            <div className="text-2xl mb-1">💬</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Chat Live</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
