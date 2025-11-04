import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
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
      await login(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent-300/30 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary-300/20 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="max-w-md w-full space-y-6 relative z-10 animate-scale-in">
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-block p-4 bg-gradient-primary rounded-3xl shadow-glow-lg animate-glow-pulse">
            <h1 className="text-5xl font-black text-white">InstaTube</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Welcome back! Sign in to continue
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8 space-y-6 animate-slide-up">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FiMail className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-dark-card-hover border-2 border-gray-200 dark:border-dark-border rounded-2xl focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FiLock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                required
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

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm font-semibold text-primary-500 hover:text-primary-600 dark:text-primary-400 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span className="font-bold text-lg">Sign In</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-dark-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-dark-card text-gray-500">or</span>
            </div>
          </div>

          {/* Guest Login Info */}
          <div className="text-center p-4 bg-gradient-to-r from-info-50 to-accent-50 dark:from-info-900/20 dark:to-accent-900/20 rounded-2xl border border-info-200/50 dark:border-info-800/50">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Demo Mode:</span> Use any email & password to explore
            </p>
          </div>
        </div>

        {/* Sign Up Link Card */}
        <div className="card p-5 text-center animate-slide-up" style={{animationDelay: '0.1s'}}>
          <p className="text-gray-700 dark:text-gray-300">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold bg-gradient-primary bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              Sign up now
            </Link>
          </p>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 animate-fade-in" style={{animationDelay: '0.3s'}}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;
