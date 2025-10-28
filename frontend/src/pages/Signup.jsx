import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
                  <div>
            <h2 className="text-center text-4xl font-bold text-gray-900 mb-2">
              InstaTube
            </h2>
            <p className="text-center text-gray-600">
              Sign up to see photos and videos from your friends
            </p>
          </div>

        <div className="card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                value={formData.username}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            By signing up, you agree to our Terms and Privacy Policy.
          </p>
        </div>

        <div className="card p-4 text-center">
          <p className="text-sm">
            Have an account?{' '}
            <Link to="/login" className="link font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
