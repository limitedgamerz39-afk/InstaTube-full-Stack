// Admin authorization middleware
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
};

// Creator or Admin
export const creatorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'creator')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Creator or Admin only.',
    });
  }
};
