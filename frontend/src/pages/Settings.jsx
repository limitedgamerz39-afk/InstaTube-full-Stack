import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { AiOutlineCamera } from 'react-icons/ai';
import { FiShield } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    gender: user?.gender || 'prefer_not_to_say',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || '');
  const [loading, setLoading] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [requesting, setRequesting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image should be less than 5MB');
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('username', formData.username);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('gender', formData.gender);
      
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }
      if (coverFile) {
        formDataToSend.append('cover', coverFile);
      }

      const response = await userAPI.updateProfile(formDataToSend);
      updateUser(response.data.data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition shadow-lg"
          >
            <FiShield className="w-5 h-5" />
            Admin Panel
          </Link>
        )}
      </div>

      {/* Role Upgrade Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-3">
          <FaCrown className="text-yellow-500 w-6 h-6 mt-1" />
          <div className="flex-1">
            <h2 className="font-semibold">Creator Access</h2>
            <p className="text-sm text-gray-600">Current role: <strong>{user?.role}</strong></p>
            {user?.roleUpgradeRequested && (
              <p className="text-sm text-yellow-700 mt-1">Your request is pending admin review.</p>
            )}
            {user?.role !== 'creator' && user?.role !== 'admin' && !user?.roleUpgradeRequested && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={upgradeReason}
                  onChange={(e) => setUpgradeReason(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Tell us briefly why you want to be a creator (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  disabled={requesting}
                  onClick={async () => {
                    try {
                      setRequesting(true);
                      const res = await userAPI.requestRoleUpgrade(upgradeReason);
                      updateUser(res.data.data);
                      toast.success('Request submitted!');
                    } catch (err) {
                      const msg = err.response?.data?.message || 'Failed to request upgrade';
                      toast.error(msg);
                    } finally {
                      setRequesting(false);
                    }
                  }}
                  className="btn-primary"
                >
                  {requesting ? 'Submitting...' : 'Request Creator Access'}
                </button>
              </div>
            )}
            {user?.role === 'creator' && (
              <p className="text-sm text-green-700 mt-2">You already have Creator access. Enjoy long videos and advanced features.</p>
            )}
          </div>
        </div>
      </div>

      {/* Appearance / Theme */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-gray-600">Current theme: <strong>{theme}</strong></p>
          </div>
          <button type="button" onClick={toggleTheme} className="btn-outline">
            Toggle Theme
          </button>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={avatarPreview}
                alt="Avatar"
                className="h-24 w-24 rounded-full object-cover"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition"
              >
                <AiOutlineCamera size={20} />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="font-semibold">{user?.username}</p>
              <p className="text-sm text-gray-500">Change profile photo</p>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <div className="relative">
              <img
                src={coverPreview}
                alt="Cover"
                className="h-24 w-full object-cover rounded-md"
              />
              <label
                htmlFor="cover-upload"
                className="absolute bottom-2 right-2 bg-primary text-white px-3 py-1 rounded-full cursor-pointer hover:bg-blue-600 transition"
              >
                Change Cover
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="input-field"
            >
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              maxLength={150}
              placeholder="Tell us about yourself..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/150 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
