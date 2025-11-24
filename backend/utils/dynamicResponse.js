/**
 * Dynamic Response Utility
 * Allows configurable field selection for API responses
 */

/**
 * Filter object fields based on allowed fields and user permissions
 * @param {Object} obj - The object to filter
 * @param {Array} allowedFields - List of fields that can be included
 * @param {Array} requiredFields - List of fields that must always be included
 * @param {Object} userPermissions - User permissions object
 * @param {Array} permissionFields - Fields that require specific permissions
 * @returns {Object} Filtered object
 */
export const filterFields = (obj, allowedFields = [], requiredFields = [], userPermissions = {}, permissionFields = {}) => {
  const result = {};
  
  // Always include required fields
  requiredFields.forEach(field => {
    if (obj[field] !== undefined) {
      result[field] = obj[field];
    }
  });
  
  // Include allowed fields based on permissions
  allowedFields.forEach(field => {
    // Skip if already included as required
    if (requiredFields.includes(field)) return;
    
    // Check if field requires specific permissions
    if (permissionFields[field]) {
      const requiredPermission = permissionFields[field];
      // If user has the required permission or is admin
      if (userPermissions[requiredPermission] || userPermissions.isAdmin) {
        if (obj[field] !== undefined) {
          result[field] = obj[field];
        }
      }
    } else {
      // No special permissions required
      if (obj[field] !== undefined) {
        result[field] = obj[field];
      }
    }
  });
  
  return result;
};

/**
 * Create a dynamic API response
 * @param {Object} options - Response options
 * @param {boolean} options.success - Success status
 * @param {string} options.message - Response message
 * @param {Object} options.data - Response data
 * @param {Array} options.fields - Fields to include in response
 * @param {Array} options.excludeFields - Fields to exclude from response
 * @param {Object} options.user - User object for permission checking
 * @param {Object} options.pagination - Pagination data
 * @param {Object} options.meta - Additional metadata
 * @returns {Object} Formatted response object
 */
export const createResponse = ({
  success = true,
  message = '',
  data = null,
  fields = null,
  excludeFields = [],
  user = null,
  pagination = null,
  meta = null,
  fromCache = false
} = {}) => {
  const response = {
    success,
    message
  };
  
  // Add data if provided
  if (data !== null) {
    let filteredData = data;
    
    // If fields are specified, filter the data
    if (fields && Array.isArray(fields) && data) {
      // Handle array of objects
      if (Array.isArray(data)) {
        filteredData = data.map(item => {
          if (typeof item === 'object' && item !== null) {
            return filterObjectFields(item, fields, excludeFields, user);
          }
          return item;
        });
      } 
      // Handle single object
      else if (typeof data === 'object' && data !== null) {
        filteredData = filterObjectFields(data, fields, excludeFields, user);
      }
    }
    // If excludeFields are specified, remove those fields
    else if (excludeFields.length > 0 && data) {
      // Handle array of objects
      if (Array.isArray(data)) {
        filteredData = data.map(item => {
          if (typeof item === 'object' && item !== null) {
            return excludeObjectFields(item, excludeFields);
          }
          return item;
        });
      } 
      // Handle single object
      else if (typeof data === 'object' && data !== null) {
        filteredData = excludeObjectFields(data, excludeFields);
      }
    }
    
    response.data = filteredData;
  }
  
  // Add pagination if provided
  if (pagination) {
    response.pagination = pagination;
  }
  
  // Add metadata if provided
  if (meta) {
    response.meta = meta;
  }
  
  // Add cache indicator
  if (fromCache) {
    response.fromCache = true;
  }
  
  return response;
};

/**
 * Filter object fields based on inclusion/exclusion lists
 * @param {Object} obj - Object to filter
 * @param {Array} includeFields - Fields to include
 * @param {Array} excludeFields - Fields to exclude
 * @param {Object} user - User object for permission checking
 * @returns {Object} Filtered object
 */
const filterObjectFields = (obj, includeFields, excludeFields, user) => {
  const result = {};
  
  // If includeFields is specified, only include those fields
  if (includeFields.length > 0) {
    includeFields.forEach(field => {
      // Handle nested fields (e.g., 'profile.name')
      if (field.includes('.')) {
        const parts = field.split('.');
        const topLevelField = parts[0];
        if (obj[topLevelField] !== undefined && !excludeFields.includes(topLevelField)) {
          // For nested objects, we include the whole top-level field
          // A more sophisticated implementation could handle deep nesting
          result[topLevelField] = obj[topLevelField];
        }
      } else {
        // Handle simple fields
        if (obj[field] !== undefined && !excludeFields.includes(field)) {
          result[field] = obj[field];
        }
      }
    });
  } else {
    // If no includeFields specified, include all except excluded fields
    Object.keys(obj).forEach(key => {
      if (!excludeFields.includes(key)) {
        result[key] = obj[key];
      }
    });
  }
  
  return result;
};

/**
 * Exclude specific fields from an object
 * @param {Object} obj - Object to process
 * @param {Array} excludeFields - Fields to exclude
 * @returns {Object} Object with excluded fields removed
 */
const excludeObjectFields = (obj, excludeFields) => {
  const result = { ...obj };
  
  excludeFields.forEach(field => {
    // Handle nested fields (e.g., 'profile.name')
    if (field.includes('.')) {
      const parts = field.split('.');
      const topLevelField = parts[0];
      // For nested objects, we remove the whole top-level field
      // A more sophisticated implementation could handle deep nesting
      delete result[topLevelField];
    } else {
      delete result[field];
    }
  });
  
  return result;
};

/**
 * Create a paginated response
 * @param {Array} items - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @param {Object} options - Additional options for createResponse
 * @returns {Object} Paginated response
 */
export const createPaginatedResponse = (items, page, limit, total, options = {}) => {
  const totalPages = Math.ceil(total / limit);
  
  return createResponse({
    ...options,
    data: items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
};

/**
 * User profile field configurations
 */
export const userProfileFields = {
  public: [
    'username',
    'fullName',
    'avatar',
    'coverImage',
    'bio',
    'gender',
    'role',
    'subscriber',
    'subscribed',
    'posts',
    'createdAt',
    'updatedAt'
  ],
  private: [
    'email',
    'isVerified',
    'verifiedAt',
    'isBanned',
    'bannedAt',
    'role',
    'roleUpgradeRequested',
    'roleUpgradeReason',
    'isPremium',
    'premiumSince',
    'premiumExpiresAt',
    'premiumPlan',
    'isMonetizationEnabled',
    'monetizationApproved',
    'totalEarnings',
    'pendingPayout',
    'totalWatchTime',
    'subscribersCount',
    'shortsEarnings',
    'lastShortsFundPayout',
    'totalShortViews',
    'businessProfile',
    'isBusinessProfileActive',
    'achievements',
    'totalAchievementPoints',
    'commentsCount',
    'sharesCount',
    'viewsCount',
    'likesGivenCount'
  ],
  admin: [
    'email',
    'isVerified',
    'verifiedAt',
    'isBanned',
    'bannedAt',
    'emailVerificationToken',
    'emailVerificationExpires',
    'passwordResetToken',
    'passwordResetExpires',
    'twoFactorEnabled',
    'twoFactorSecret',
    'twoFactorBackupCodes',
    'adminPermissions',
    'role',
    'roleUpgradeRequested',
    'roleUpgradeReason'
  ]
};

export default {
  filterFields,
  createResponse,
  createPaginatedResponse,
  userProfileFields
};