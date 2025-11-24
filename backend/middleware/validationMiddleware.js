import { body, validationResult, param, query } from 'express-validator';

// ✅ Centralized validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ✅ User validation rules
export const userValidationRules = {
  register: [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('fullName')
      .isLength({ min: 1, max: 50 })
      .withMessage('Full name must be between 1 and 50 characters')
      .trim(),
    validate
  ],
  
  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate
  ],
  
  updateProfile: [
    body('fullName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Full name must be between 1 and 50 characters')
      .trim(),
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('bio')
      .optional()
      .isLength({ max: 150 })
      .withMessage('Bio cannot exceed 150 characters'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Invalid gender value'),
    validate
  ]
};

// ✅ Post validation rules
export const postValidationRules = {
  createPost: [
    body('title')
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('category')
      .optional()
      .isIn(['image', 'video', 'short', 'long'])
      .withMessage('Invalid category'),
    body('privacy')
      .optional()
      .isIn(['public', 'private', 'subscribed'])
      .withMessage('Invalid privacy setting'),
    validate
  ],
  
  updatePost: [
    param('id')
      .isMongoId()
      .withMessage('Invalid post ID'),
    body('title')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    validate
  ],
  
  comment: [
    param('id')
      .isMongoId()
      .withMessage('Invalid post ID'),
    body('text')
      .isLength({ min: 1, max: 500 })
      .withMessage('Comment must be between 1 and 500 characters'),
    validate
  ]
};

// ✅ File upload validation
export const fileValidationRules = {
  image: (req, res, next) => {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }
    
    const file = req.files.image[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, JPG, PNG, GIF, and WebP are allowed'
      });
    }
    
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit'
      });
    }
    
    next();
  },
  
  video: (req, res, next) => {
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }
    
    const file = req.files.video[0];
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'];
    const maxSize = 1000 * 1024 * 1024; // 1GB
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only MP4, MOV, WebM, and OGG are allowed'
      });
    }
    
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 1GB limit'
      });
    }
    
    next();
  }
};

// ✅ ID validation middleware
export const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  validate
];

// ✅ Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  validate
];

// ✅ Search validation
export const validateSearch = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  validate
];