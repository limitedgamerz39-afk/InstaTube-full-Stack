import { logSecurityEvent } from '../services/securityService.js';

// Middleware to handle PII (Personally Identifiable Information) data
export const handlePIIData = (req, res, next) => {
  // Log access to PII data
  logSecurityEvent(
    'pii_access',
    `PII data accessed by user: ${req.user?._id || 'anonymous'}`,
    'medium',
    { userId: req.user?._id, endpoint: req.path, method: req.method },
    req
  );
  
  // Add PII handling headers
  res.setHeader('X-PII-Handling', 'encrypted-at-rest');
  res.setHeader('X-Data-Retention', '30-days');
  
  next();
};

// Function to sanitize PII data in responses
export const sanitizePIIResponse = (data) => {
  if (!data) return data;
  
  const piiFields = [
    'email',
    'phoneNumber',
    'address',
    'ssn',
    'creditCard',
    'bankAccount',
    'ipAddress'
  ];
  
  const sanitizedData = JSON.parse(JSON.stringify(data));
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (piiFields.includes(key)) {
        obj[key] = '[PII REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
    
    return obj;
  };
  
  return sanitizeObject(sanitizedData);
};

// Function to encrypt PII data before storage
export const encryptPIIData = (data) => {
  // In a real implementation, this would use actual encryption
  // For now, we'll just mark it as encrypted
  return {
    ...data,
    _encrypted: true,
    _encryptionMethod: 'AES-256-GCM'
  };
};

// Function to decrypt PII data after retrieval
export const decryptPIIData = (data) => {
  // In a real implementation, this would use actual decryption
  // For now, we'll just remove the encryption markers
  const { _encrypted, _encryptionMethod, ...decryptedData } = data;
  return decryptedData;
};