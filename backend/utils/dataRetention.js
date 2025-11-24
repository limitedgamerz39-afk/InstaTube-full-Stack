// Data retention utility functions

/**
 * Calculate retention period based on data type
 * @param {string} dataType - Type of data
 * @returns {number} Retention period in days
 */
export const getRetentionPeriod = (dataType) => {
  const retentionPeriods = {
    'user_profile': 3650, // 10 years
    'user_posts': 3650,   // 10 years
    'user_comments': 1825, // 5 years
    'user_messages': 365,  // 1 year
    'user_activity': 365,  // 1 year
    'login_logs': 365,     // 1 year
    'security_logs': 730,  // 2 years
    'payment_data': 2555,  // 7 years (financial records)
    'default': 30          // 30 days for other data
  };
  
  return retentionPeriods[dataType] || retentionPeriods['default'];
};

/**
 * Check if data has exceeded retention period
 * @param {Date} createdAt - Creation date of data
 * @param {string} dataType - Type of data
 * @returns {boolean} True if data should be deleted
 */
export const isDataExpired = (createdAt, dataType) => {
  const retentionDays = getRetentionPeriod(dataType);
  const expirationDate = new Date(createdAt);
  expirationDate.setDate(expirationDate.getDate() + retentionDays);
  
  return new Date() > expirationDate;
};

/**
 * Schedule data deletion task
 * @param {string} dataType - Type of data
 * @param {Function} deleteFunction - Function to delete data
 */
export const scheduleDataDeletion = (dataType, deleteFunction) => {
  const retentionDays = getRetentionPeriod(dataType);
  
  // In a real implementation, this would use a job scheduler like node-cron
  console.log(`Scheduled deletion for ${dataType} data after ${retentionDays} days`);
  
  // For demonstration, we'll just return the configuration
  return {
    dataType,
    retentionDays,
    nextRun: new Date(Date.now() + (retentionDays * 24 * 60 * 60 * 1000))
  };
};

/**
 * Anonymize user data instead of deleting it
 * @param {Object} userData - User data to anonymize
 * @returns {Object} Anonymized user data
 */
export const anonymizeUserData = (userData) => {
  return {
    ...userData,
    username: `anonymized_${Math.random().toString(36).substr(2, 9)}`,
    email: `anonymized_${Math.random().toString(36).substr(2, 9)}@deleted.account`,
    fullName: 'Deleted User',
    avatar: '/default-avatar.png',
    coverImage: '/default-bg.jpg',
    bio: 'This account has been deleted',
    isDeleted: true,
    deletedAt: new Date()
  };
};

/**
 * Generate data retention report
 * @param {Array} dataCollections - Array of data collection information
 * @returns {Object} Retention report
 */
export const generateRetentionReport = (dataCollections) => {
  const report = {
    generatedAt: new Date(),
    totalCollections: dataCollections.length,
    byRetentionPeriod: {},
    expiredData: []
  };
  
  dataCollections.forEach(collection => {
    const period = getRetentionPeriod(collection.type);
    
    if (!report.byRetentionPeriod[period]) {
      report.byRetentionPeriod[period] = {
        count: 0,
        collections: []
      };
    }
    
    report.byRetentionPeriod[period].count++;
    report.byRetentionPeriod[period].collections.push(collection);
    
    if (isDataExpired(collection.createdAt, collection.type)) {
      report.expiredData.push(collection);
    }
  });
  
  return report;
};
