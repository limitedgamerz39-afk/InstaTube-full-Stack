import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { AiOutlineCamera, AiOutlineCheck, AiOutlineLoading3Quarters, AiOutlineShop } from 'react-icons/ai';
import { FiShield, FiMoon, FiSun, FiKey, FiHelpCircle, FiMail, FiUser, FiCreditCard } from 'react-icons/fi';
import { FaCrown, FaUserEdit, FaPalette } from 'react-icons/fa';
import { MdOutlinePhotoSizeSelectActual } from 'react-icons/md';
import SecuritySettings from '../components/SecuritySettings';

const Settings = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    gender: user?.gender || 'prefer_not_to_say',
    website: user?.website || '',
    socialLinks: {
      twitter: user?.socialLinks?.twitter || '',
      instagram: user?.socialLinks?.instagram || '',
      youtube: user?.socialLinks?.youtube || '',
      linkedin: user?.socialLinks?.linkedin || '',
      facebook: user?.socialLinks?.facebook || '',
    },
  });

  // Ref to track previous user data
  const prevUserRef = useRef();
  
  // Update form data when user data changes
  useEffect(() => {
    // Check if user data has actually changed
    const prevUser = prevUserRef.current;
    
    // Only update if user exists and data has changed
    if (user && (!prevUser || 
      prevUser.fullName !== user.fullName ||
      prevUser.username !== user.username ||
      prevUser.bio !== user.bio ||
      prevUser.gender !== user.gender ||
      prevUser.website !== user.website ||
      prevUser.socialLinks?.twitter !== user.socialLinks?.twitter ||
      prevUser.socialLinks?.instagram !== user.socialLinks?.instagram ||
      prevUser.socialLinks?.youtube !== user.socialLinks?.youtube ||
      prevUser.socialLinks?.linkedin !== user.socialLinks?.linkedin ||
      prevUser.socialLinks?.facebook !== user.socialLinks?.facebook)) {
      
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        bio: user.bio || '',
        gender: user.gender || 'prefer_not_to_say',
        website: user.website || '',
        socialLinks: {
          twitter: user.socialLinks?.twitter || '',
          instagram: user.socialLinks?.instagram || '',
          youtube: user.socialLinks?.youtube || '',
          linkedin: user.socialLinks?.linkedin || '',
          facebook: user.socialLinks?.facebook || '',
        },
      });
      setCharCount(user.bio?.length || 0);
    }
    
    // Update the ref
    prevUserRef.current = user;
  }, [user]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || '');
  const [loading, setLoading] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [charCount, setCharCount] = useState(formData.bio.length);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested socialLinks object
    if (name.startsWith('socialLinks.')) {
      const socialPlatform = name.split('.')[1];
      setFormData({
        ...formData,
        socialLinks: {
          ...formData.socialLinks,
          [socialPlatform]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });

      if (name === 'bio') {
        setCharCount(value.length);
      }
    }
  };

  // Initialize charCount when component mounts
  useEffect(() => {
    setCharCount(formData.bio?.length || 0);
  }, []);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
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

    toast.success('Cover image selected! Click save to update.');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
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

    toast.success('Profile picture selected! Click save to update.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Always send all fields to ensure proper updates
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('username', formData.username);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('website', formData.website);
      formDataToSend.append('socialLinks', JSON.stringify(formData.socialLinks));

      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }
      if (coverFile) {
        formDataToSend.append('cover', coverFile);
      }

      const response = await userAPI.updateProfile(formDataToSend);
      updateUser(response.data.data);
      toast.success('Profile updated successfully! 🎉');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      
      // If it's a username restriction error, we might want to reset the username field
      if (errorMessage.includes('15 days') || errorMessage.includes('username')) {
        setFormData(prev => ({
          ...prev,
          username: user?.username || prev.username
        }));
      }
    } finally {
      setLoading(false);
    }
  };
// Refresh user data when settings page loads only once
useEffect(() => {
  let isMounted = true;

  const timer = setTimeout(() => {
    if (isMounted) {
      refreshUser().catch((error) => {
        console.error("Failed to refresh user data:", error);
      });
    }
  }, 150); // little delay is fine

  return () => {
    isMounted = false;
    clearTimeout(timer);
  };
}, []); // 👈 EMPTY dependency = run only once


  const sections = [
    { id: 'profile', label: 'Personal Info', icon: FiUser },
    { id: 'account', label: 'Account Status', icon: FiShield },
    { id: 'security', label: 'Security', icon: FiKey },
    { id: 'billing', label: 'Billing & Plans', icon: FiCreditCard },
    { id: 'appearance', label: 'Appearance', icon: FaPalette },
    { id: 'help', label: 'Help Center', icon: FiHelpCircle },
    { id: 'contact', label: 'Contact Support', icon: FiMail },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your profile, appearance, and account preferences
            </p>
          </div>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FiShield className="w-5 h-5" />
              <span className="font-semibold">Admin Panel</span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        if (section.id === 'help') {
                          navigate('/help');
                          return;
                        }
                        if (section.id === 'contact') {
                          navigate('/contact');
                          return;
                        }
                        setActiveSection(section.id);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        (activeSection === section.id) && (section.id !== 'help' && section.id !== 'contact')
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Personal Info Section */}
            {activeSection === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Cover Image */}
                <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                  {coverPreview && (
                    <img
                      src={coverPreview}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <label
                    htmlFor="cover-upload"
                    className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 shadow-lg flex items-center gap-2 font-medium"
                  >
                    <MdOutlinePhotoSizeSelectActual className="w-5 h-5" />
                    {coverPreview ? 'Change Cover' : 'Add Cover'}
                  </label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                  {/* Avatar Upload */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-20 relative z-10">
                    <div className="relative group">
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="h-32 w-32 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-xl"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      >
                        <div className="text-white text-center">
                          <AiOutlineCamera className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-sm font-medium">Change</span>
                        </div>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>

                    <div className="text-center sm:text-left mt-4 sm:mt-12">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {formData.fullName || user?.fullName}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">@{formData.username || user?.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Click on the avatar to upload a new profile picture
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Username
                        {user?.usernameLastChanged && (
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                            (Last changed: {new Date(user.usernameLastChanged).toLocaleDateString()})
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                        placeholder="Enter your username"
                      />
                      {user?.usernameLastChanged && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {(() => {
                            const daysSinceLastChange = (Date.now() - new Date(user.usernameLastChanged).getTime()) / (1000 * 60 * 60 * 24);
                            if (daysSinceLastChange < 15) {
                              return `You can change your username again in ${Math.ceil(15 - daysSinceLastChange)} days.`;
                            } else {
                              return 'You can change your username now.';
                            }
                          })()}
                        </p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                      >
                        <option value="prefer_not_to_say">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Bio */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Bio
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
                          {charCount}/150 characters
                        </span>
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        maxLength={150}
                        placeholder="Tell us about yourself..."
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none dark:text-white"
                      />
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(charCount / 150) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                      />
                    </div>

                    {/* Social Links Header */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-3">Social Links</h3>
                    </div>

                    {/* Twitter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Twitter
                      </label>
                      <input
                        type="url"
                        name="socialLinks.twitter"
                        value={formData.socialLinks.twitter}
                        onChange={handleChange}
                        placeholder="https://twitter.com/username"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                      />
                    </div>

                    {/* Instagram */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Instagram
                      </label>
                      <input
                        type="url"
                        name="socialLinks.instagram"
                        value={formData.socialLinks.instagram}
                        onChange={handleChange}
                        placeholder="https://instagram.com/username"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                      />
                    </div>

                    {/* YouTube */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        YouTube
                      </label>
                      <input
                        type="url"
                        name="socialLinks.youtube"
                        value={formData.socialLinks.youtube}
                        onChange={handleChange}
                        placeholder="https://youtube.com/@username"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        name="socialLinks.linkedin"
                        value={formData.socialLinks.linkedin}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                      />
                    </div>

                    {/* Facebook */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Facebook
                      </label>
                      <input
                        type="url"
                        name="socialLinks.facebook"
                        value={formData.socialLinks.facebook}
                        onChange={handleChange}
                        placeholder="https://facebook.com/username"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                          <span>Saving Changes...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <AiOutlineCheck className="w-5 h-5" />
                          <span>Save Changes</span>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Account Status Section */}
            {activeSection === 'account' && (
              <div className="space-y-8">
                {/* Role Display Card */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                      <FiShield className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Account Role
                      </h2>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          Current Role:
                        </span>
                        <span className={`px-4 py-2 rounded-full text-base font-bold ${user?.role === 'admin'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : user?.role === 'creator'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : user?.role === 'business'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                          {user?.role === 'admin'
                            ? 'Administrator'
                            : user?.role === 'creator'
                            ? 'Creator'
                            : user?.role === 'business'
                            ? 'Business'
                            : 'User'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {user?.role === 'admin'
                          ? 'You have full administrative privileges to manage the platform.'
                          : user?.role === 'creator'
                          ? 'You have access to creator tools for content creation and monetization.'
                          : user?.role === 'business'
                          ? 'You have access to business tools for selling products and services.'
                          : 'Standard user account with basic features.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Upgrade Card */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                      <FaCrown className="text-yellow-600 dark:text-yellow-400 w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {user?.role === 'admin' ? 'Admin Access' :
                            user?.role === 'business' ? 'Business Access' :
                              user?.role === 'creator' ? 'Creator Access' : 'Account Access'}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user?.role === 'admin' || user?.role === 'creator' || user?.role === 'business'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {user?.role === 'admin' || user?.role === 'creator' || user?.role === 'business' ? 'Active' : 'Upgrade Available'}
                        </span>
                      </div>

                      {/* Pending Request Status - Only for users */}
                      {user?.role === 'user' && user?.roleUpgradeRequested && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
                            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                            <span className="font-medium">Your Creator request is pending admin review</span>
                          </div>
                        </div>
                      )}

                      {/* Creator Access Request - ONLY for regular users */}
                      {user?.role === 'user' && !user?.roleUpgradeRequested && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Why do you want to be a creator? (Optional)
                            </label>
                            <textarea
                              value={upgradeReason}
                              onChange={(e) => setUpgradeReason(e.target.value)}
                              rows={3}
                              maxLength={200}
                              placeholder="Tell us briefly about your content creation plans..."
                              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 resize-none dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {upgradeReason.length}/200 characters
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={requesting}
                            onClick={async () => {
                              try {
                                setRequesting(true);
                                const res = await userAPI.requestRoleUpgrade(upgradeReason);
                                updateUser(res.data.data);
                                toast.success('Request submitted successfully! 🎉');
                              } catch (err) {
                                const msg = err.response?.data?.message || 'Failed to request upgrade';
                                toast.error(msg);
                              } finally {
                                setRequesting(false);
                              }
                            }}
                            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
                          >
                            {requesting ? (
                              <div className="flex items-center justify-center gap-2">
                                <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                                <span>Submitting Request...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <FaCrown className="w-5 h-5" />
                                <span>Request Creator Access</span>
                              </div>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Role Status Messages - Show based on actual role */}
                      {user?.role === 'admin' && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                            <FiShield className="w-5 h-5" />
                            <span className="font-medium">Administrator access active! Full platform management available.</span>
                          </div>
                          <ul className="mt-3 text-sm text-red-700 dark:text-red-300 space-y-1">
                            <li>• Manage users & content</li>
                            <li>• Platform moderation</li>
                            <li>• System configuration</li>
                          </ul>
                        </div>
                      )}

                      {user?.role === 'business' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                            <AiOutlineShop className="w-5 h-5" />
                            <span className="font-medium">Business access active! Manage products & analytics.</span>
                          </div>
                          <ul className="mt-3 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• Product management</li>
                            <li>• Sales analytics</li>
                            <li>• Business dashboard</li>
                          </ul>
                        </div>
                      )}

                      {user?.role === 'creator' && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                            <AiOutlineCheck className="w-5 h-5" />
                            <span className="font-medium">Creator access active! Long videos & advanced features unlocked.</span>
                          </div>
                          <ul className="mt-3 text-sm text-green-700 dark:text-green-300 space-y-1">
                            <li>• Unlimited video length</li>
                            <li>• Advanced editing tools</li>
                            <li>• Priority support</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FaPalette className="text-purple-600 dark:text-purple-400 w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <FiSun className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Light Mode</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Clean and bright</p>
                        </div>
                      </div>
                      <div className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${theme === 'light' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`} onClick={toggleTheme}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform duration-300 ${theme === 'light' ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <FiMoon className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Easy on the eyes</p>
                        </div>
                      </div>
                      <div className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`} onClick={toggleTheme}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center p-8">
                    <div className={`w-32 h-32 rounded-2xl border-4 transition-all duration-300 ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 shadow-xl'
                        : 'bg-white border-gray-200 shadow-lg'
                      }`}>
                      <div className="p-4 space-y-3">
                        <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                          }`} />
                        <div className={`h-2 rounded-full w-3/4 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                          }`} />
                        <div className={`h-2 rounded-full w-1/2 ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
                          }`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing & Plans Section */}
            {activeSection === 'billing' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FiCreditCard className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing & Plans</h2>
                </div>

                <div className="text-center py-12">
                  <FiCreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manage Your Subscription</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    View your billing history, update payment methods, and manage your subscription plan.
                  </p>
                  <button
                    onClick={() => navigate('/premium')}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    View Plans
                  </button>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <SecuritySettings />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;