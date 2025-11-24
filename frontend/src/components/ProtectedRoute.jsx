import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if user has that role or is admin
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    // Redirect to appropriate dashboard based on user role
    switch (user.role) {
      case 'creator':
        return <Navigate to="/creator" replace />;
      case 'business':
        return <Navigate to="/business/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;