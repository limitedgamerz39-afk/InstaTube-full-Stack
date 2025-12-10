import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import all icons
import {
  AiOutlineHome,
  AiOutlineCompass,
  AiOutlinePlaySquare,
  AiOutlineGroup,
  AiOutlineUser,
  AiOutlineUserAdd,
  AiOutlineVideoCamera,
  AiOutlineShopping,
  AiOutlineDollar,
  AiOutlineBarChart,
  AiOutlineSetting,
  AiOutlineLogout,
  AiOutlineShop,
  AiOutlineTrophy,
  AiOutlineFolderOpen, // For Saved
  AiOutlineDatabase, // For Archive
  AiOutlineBarChart as AiOutlineBarChart2, // For Analytics
  AiOutlineUsergroupAdd, // For Close Friends
  AiOutlineCalendar, // For Schedule
  AiOutlinePlayCircle, // For Playlists
  AiOutlineTeam, // For Community
  AiOutlineFire, // For Trending
  AiOutlineCrown, // For Premium
} from 'react-icons/ai';

import {
  BsFilm,
  BsCollectionPlay,
  BsLightbulb,
  BsGraphUp,
  BsBookmark,
  BsHeart,
  BsClock,

} from 'react-icons/bs';

import {
  FiShield,
  FiLogOut,
  FiSettings,
  FiUser,
  FiHelpCircle,
  FiMail,
  FiPhone,
  FiMapPin,
  FiGlobe,
  FiCalendar,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiKey,
  FiLock,
  FiUnlock,
  FiEye,
  FiEyeOff,
  FiDownload,
  FiUpload,
  FiShare2,
  FiFlag,
  FiMessageSquare,
  FiList,
  FiGrid,
  FiHome,
  FiCompass,
  FiSearch,
  FiPlus,
  FiHeart,
  FiBookmark,
  FiSettings as FiSettings2,
  FiLogOut as FiLogOut2,
  FiUser as FiUser2,
  FiX,
  FiHelpCircle as FiHelpCircle2,
  FiMail as FiMail2,
  FiPhone as FiPhone2,
  FiMapPin as FiMapPin2,
  FiGlobe as FiGlobe2,
  FiCalendar as FiCalendar2,
  FiBarChart2 as FiBarChart22,
  FiPieChart as FiPieChart2,
  FiActivity as FiActivity2,
  FiKey as FiKey2,
  FiLock as FiLock2,
  FiUnlock as FiUnlock2,
  FiEye as FiEye2,
  FiEyeOff as FiEyeOff2,
  FiDownload as FiDownload2,
  FiUpload as FiUpload2,
  FiShare2 as FiShare22,
  FiFlag as FiFlag2,
  FiMessageSquare as FiMessageSquare2,
  FiList as FiList2,
  FiGrid as FiGrid2,
  FiImage as FiImage2,
  FiHeart as FiHeart2,
  FiBookmark as FiBookmark2,
} from 'react-icons/fi';

const RoleBasedMenu = ({ onClose, isActive }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  // Get menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      // Basic navigation items
      { icon: AiOutlineHome, label: 'Home', path: '/', divider: false },
      { icon: AiOutlineCompass, label: 'Explore', path: '/explore', divider: false },
      { icon: BsFilm, label: 'Reels', path: '/reels', divider: false },
      { icon: AiOutlineTrophy, label: 'Achievements', path: '/achievements', divider: false }, // Added achievements button
      { icon: AiOutlineGroup, label: 'Groups', path: '/groups', divider: false },
      { divider: true },

      // User content items
      { icon: AiOutlineUser, label: 'My Profile', path: `/profile/${user?.username}`, divider: false },
      { icon: AiOutlineFolderOpen, label: 'Saved Content', path: '/saved', divider: false }, // Added Saved Content
      { icon: AiOutlineDatabase, label: 'Archive', path: '/archive', divider: false }, // Added Archive
      { icon: AiOutlineUserAdd, label: 'Subscriptions', path: '/subscriptions', divider: false },
      { icon: BsBookmark, label: 'Library', path: '/library', divider: false },
      { icon: BsClock, label: 'History', path: '/history', divider: false },
      { icon: BsClock, label: 'Watch Later', path: '/watch-later', divider: false },
      { icon: BsHeart, label: 'Liked Videos', path: '/history', divider: false },
      { divider: true },

      // Additional features for all users
      { icon: AiOutlineBarChart2, label: 'Analytics', path: '/analytics', divider: false }, // Added Analytics
      { icon: AiOutlineUsergroupAdd, label: 'Close Friends', path: '/close-friends', divider: false }, // Added Close Friends
      { icon: AiOutlineCalendar, label: 'Schedule Posts', path: '/schedule', divider: false }, // Added Schedule Posts
      { icon: AiOutlinePlayCircle, label: 'Playlists', path: '/playlists', divider: false }, // Added Playlists
      { icon: AiOutlineTeam, label: 'Community', path: '/community', divider: false }, // Added Community
      { icon: AiOutlineFire, label: 'Trending', path: '/trending', divider: false }, // Added Trending
      { divider: true },
    ];

    // Creator specific items
    const creatorItems = [
      { icon: AiOutlineVideoCamera, label: 'Upload Video', path: '/upload', divider: false },
      { icon: BsCollectionPlay, label: 'My Content', path: '/my-content', divider: false },
      { icon: BsLightbulb, label: 'Creator Studio', path: '/creator-studio', divider: false },
      // Removed Analytics and Earnings buttons as they're now integrated into Creator Studio
      { divider: true },
    ];

    // Business specific items
    const businessItems = [
      { icon: AiOutlineShop, label: 'Business Dashboard', path: '/business/dashboard', divider: false },
      // Removed Products and Business Analytics as they will be accessed from buttons within the dashboard
    ];

    // Admin specific items
    const adminItems = [
      { icon: FiShield, label: 'Admin Panel', path: '/admin', divider: false },
      // Removed Analytics and Earnings buttons as they're now integrated into Creator Studio
    ];

    // Settings and preferences
    const settingsItems = [
      { icon: AiOutlineSetting, label: 'Settings', path: '/settings', divider: false },
      { divider: true },
    ];

    // Premium
    const premiumItems = [
      { icon: AiOutlineCrown, label: 'Premium', path: '/premium', divider: false },
      { divider: true },
    ];

    // Logout
    const logoutItem = [
      { icon: AiOutlineLogout, label: 'Logout', action: handleLogout, divider: false }
    ];

    // Combine items based on user role
    let items = [...baseItems];

    if (user?.role === 'creator' || user?.role === 'admin') {
      items = [...items, ...creatorItems];
    }

    if (user?.role === 'business' || user?.role === 'admin') {
      items = [...items, ...businessItems];
    }

    if (user?.role === 'admin') {
      items = [...items, ...adminItems];
    }

    items = [...items, ...settingsItems, ...premiumItems, ...logoutItem];

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div className="py-2 max-h-96 overflow-y-auto">
      {menuItems.map((item, index) => {
        // Skip items that shouldn't be shown based on role
        if (item.adminOnly && user?.role !== 'admin') return null;

        if (item.divider) {
          return <div key={index} className="border-t border-gray-200 dark:border-gray-700 my-2"></div>;
        }

        if (item.action) {
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.action();
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={index}
            to={item.path}
            onClick={() => {
              const isMobile = window.innerWidth < 768;
              if (isMobile) {
                setTimeout(() => onClose(), 100);
              }
            }}
            className={`flex items-center space-x-3 px-4 py-3 text-left transition-colors ${isActive(item.path)
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>

        );
      })}
    </div>
  );
};

export default RoleBasedMenu;