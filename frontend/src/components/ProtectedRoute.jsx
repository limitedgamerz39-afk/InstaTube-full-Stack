import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isVerifying, isAuthenticated, hasValidToken } = useAuth();
  const location = useLocation();
  
  // Store the current location in localStorage so we can redirect back after auth verification
  if (!loading) {
    localStorage.setItem('lastVisitedPath', location.pathname + location.search);
  }

  if (loading) {
    // Show children while loading to prevent flickering and maintain user context
    // This allows users to stay on the same page during auth verification
    return children || <Loader />;
  }

  // If user is not authenticated, redirect to auth page
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If a specific role is required, check if user has that role or is admin
  if (requiredRole) {
    // Normalize requiredRole to array for consistent handling
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Check if user has any of the required roles or is admin
    const hasRequiredRole = requiredRoles.includes(user.role) || user.role === 'admin';
    
    if (!hasRequiredRole) {
      // If we're still verifying user data, stay on the page
      if (isVerifying) {
        return children;
      }
      
      // If we don't have a valid token, we can't redirect properly, so stay on page
      // and let the user refresh or login again
      if (!hasValidToken) {
        return children;
      }
      
      // Redirect to appropriate dashboard based on user role
      switch (user.role) {
        case 'creator':
          return <Navigate to="/creator" replace />;
        case 'business':
          return <Navigate to="/business/dashboard" replace />;
        case 'admin':
          // Admins can access all routes, so don't redirect
          break;
        default:
          return <Navigate to="/" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;