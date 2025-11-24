// Utility functions for input validation and sanitization

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Username validation
export const isValidUsername = (username) => {
  // Alphanumeric and underscore only, 3-20 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Phone number validation
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// URL validation
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Sanitize HTML content
export const sanitizeHTML = (html) => {
  // Remove script tags and other potentially dangerous elements
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base'];
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  dangerousTags.forEach(tag => {
    const elements = tempDiv.getElementsByTagName(tag);
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  });
  
  return tempDiv.innerHTML;
};

// Validate file type
export const isValidFileType = (fileName, allowedTypes) => {
  const fileExtension = fileName.split('.').pop().toLowerCase();
  return allowedTypes.includes(fileExtension);
};

// Validate file size (in bytes)
export const isValidFileSize = (fileSize, maxSize) => {
  return fileSize <= maxSize;
};

// Escape HTML special characters
export const escapeHTML = (str) => {
  return str.replace(/[&<>"']/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[tag]));
};

// Validate and sanitize form data
export const validateAndSanitizeForm = (formData, rules) => {
  const errors = {};
  const sanitizedData = {};
  
  for (const field in rules) {
    const value = formData[field];
    const rule = rules[field];
    
    // Required field check
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = rule.messages?.required || `${field} is required`;
      continue;
    }
    
    // Skip validation for empty optional fields
    if (!value) {
      sanitizedData[field] = value;
      continue;
    }
    
    // Type-specific validation
    if (rule.type === 'email' && !isValidEmail(value)) {
      errors[field] = rule.messages?.invalid || 'Please enter a valid email address';
      continue;
    }
    
    if (rule.type === 'password' && !isValidPassword(value)) {
      errors[field] = rule.messages?.invalid || 'Password must be at least 8 characters with uppercase, lowercase, and number';
      continue;
    }
    
    if (rule.type === 'username' && !isValidUsername(value)) {
      errors[field] = rule.messages?.invalid || 'Username must be 3-20 characters, alphanumeric or underscore only';
      continue;
    }
    
    if (rule.type === 'phone' && !isValidPhone(value)) {
      errors[field] = rule.messages?.invalid || 'Please enter a valid phone number';
      continue;
    }
    
    if (rule.type === 'url' && !isValidURL(value)) {
      errors[field] = rule.messages?.invalid || 'Please enter a valid URL';
      continue;
    }
    
    // Length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = rule.messages?.minLength || `${field} must be at least ${rule.minLength} characters`;
      continue;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = rule.messages?.maxLength || `${field} must be no more than ${rule.maxLength} characters`;
      continue;
    }
    
    // Sanitize the value
    sanitizedData[field] = rule.sanitize !== false ? sanitizeInput(value) : value;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
};