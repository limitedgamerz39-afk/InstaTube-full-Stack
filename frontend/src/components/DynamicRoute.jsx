import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

const DynamicRoute = ({ 
  component: Component, 
  requiresAuth = false, 
  requiredRole = null, 
  layout = 'default',
  title = '',
  setMobileSidebarOpen 
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Set page title if provided
    if (title) {
      document.title = title;
    }
  }, [title]);

  // Handle authentication requirements
  useEffect(() => {
    if (!loading && requiresAuth && !user) {
      navigate('/login');
    }
    
    if (!loading && requiredRole && user && user.role !== requiredRole && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, loading, requiresAuth, requiredRole, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Handle unauthorized access
  if (requiresAuth && !user) {
    return null;
  }

  if (requiredRole && user && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Render the component with appropriate layout
  const renderComponent = () => {
    if (layout === 'minimal') {
      return <Component />;
    }

    return (
      <div className="min-h-screen">
        {/* Desktop Navbar - hidden on mobile */}
        <div className="hidden md:block">
          <Navbar setMobileSidebarOpen={setMobileSidebarOpen} />
        </div>
        
        {/* Main content with mobile padding */}
        <div id="main-content" className="pt-16 md:pt-0 px-0 sm:px-2 md:px-4 pb-20 md:pb-0">
          <Component />
        </div>
        
        {/* Mobile Bottom Nav - only visible on mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    );
  };

  return renderComponent();
};

export default DynamicRoute;