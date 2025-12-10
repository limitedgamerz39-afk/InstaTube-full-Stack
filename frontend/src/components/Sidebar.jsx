
const Sidebar = ({ isOpen, toggleSidebar }) => {
  
  const menuItems = [
    // ... existing menu items ...
    {
      name: 'Ad Showcase',
      icon: <MdOutlineAdsClick className="w-6 h-6" />,
      path: '/ads',
      roles: ['user', 'admin', 'creator']
    },
    // ... existing menu items ...
  ];

};

export default Sidebar;