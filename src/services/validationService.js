import DOMPurify from 'dompurify';

// 🔒 Input Validation & Sanitization Service
class ValidationService {
  constructor() {
    this.validationRules = {
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        minLength: 5,
        maxLength: 254
      },
      password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      username: {
        pattern: /^[a-zA-Z0-9_-]{3,20}$/,
        minLength: 3,
        maxLength: 20
      },
      phone: {
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
        minLength: 10,
        maxLength: 15
      },
      amount: {
        min: 0.000001,
        max: 1000000,
        decimals: 6
      },
      walletAddress: {
        pattern: /^0x[a-fA-F0-9]{40}$/,
        length: 42
      },
      transactionHash: {
        pattern: /^0x[a-fA-F0-9]{64}$/,
        length: 66
      }
    };

    this.sanitizationRules = {
      html: {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br'],
        allowedAttributes: {
          'a': ['href', 'target']
        }
      },
      sql: {
        keywords: [
          'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
          'EXEC', 'EXECUTE', 'UNION', 'WHERE', 'FROM', 'JOIN', 'OR', 'AND'
        ]
      },
      xss: {
        dangerousPatterns: [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /vbscript:/gi,
          /data:/gi
        ]
      }
    };
  }

  // 🔒 Email Validation
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required and must be a string' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    if (trimmedEmail.length < this.validationRules.email.minLength) {
      return { isValid: false, error: `Email must be at least ${this.validationRules.email.minLength} characters long` };
    }

    if (trimmedEmail.length > this.validationRules.email.maxLength) {
      return { isValid: false, error: `Email must be no more than ${this.validationRules.email.maxLength} characters long` };
    }

    if (!this.validationRules.email.pattern.test(trimmedEmail)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Check for common disposable email domains
    const disposableDomains = [
      'tempmail.org', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
      'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'sharklasers.com'
    ];
    
    const domain = trimmedEmail.split('@')[1];
    if (disposableDomains.includes(domain)) {
      return { isValid: false, error: 'Disposable email addresses are not allowed' };
    }

    return { isValid: true, sanitized: trimmedEmail };
  }

  // 🔒 Password Validation
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required and must be a string' };
    }

    if (password.length < this.validationRules.password.minLength) {
      return { isValid: false, error: `Password must be at least ${this.validationRules.password.minLength} characters long` };
    }

    if (password.length > this.validationRules.password.maxLength) {
      return { isValid: false, error: `Password must be no more than ${this.validationRules.password.maxLength} characters long` };
    }

    if (this.validationRules.password.requireUppercase && !/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (this.validationRules.password.requireLowercase && !/[a-z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (this.validationRules.password.requireNumbers && !/\d/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }

    if (this.validationRules.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one special character' };
    }

    // Check for common weak passwords
    const weakPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
      'password123', 'admin123', '123456789', 'qwerty123'
    ];
    
    if (weakPasswords.includes(password.toLowerCase())) {
      return { isValid: false, error: 'Password is too common. Please choose a stronger password' };
    }

    return { isValid: true, sanitized: password };
  }

  // 🔒 Username Validation
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { isValid: false, error: 'Username is required and must be a string' };
    }

    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < this.validationRules.username.minLength) {
      return { isValid: false, error: `Username must be at least ${this.validationRules.username.minLength} characters long` };
    }

    if (trimmedUsername.length > this.validationRules.username.maxLength) {
      return { isValid: false, error: `Username must be no more than ${this.validationRules.username.maxLength} characters long` };
    }

    if (!this.validationRules.username.pattern.test(trimmedUsername)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    // Check for reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'support', 'help',
      'info', 'contact', 'mail', 'webmaster', 'noreply', 'test'
    ];
    
    if (reservedUsernames.includes(trimmedUsername.toLowerCase())) {
      return { isValid: false, error: 'This username is reserved and cannot be used' };
    }

    return { isValid: true, sanitized: trimmedUsername };
  }

  // 🔒 Amount Validation (for crypto transactions)
  validateAmount(amount, currency = 'USD') {
    if (amount === null || amount === undefined || amount === '') {
      return { isValid: false, error: 'Amount is required' };
    }

    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return { isValid: false, error: 'Amount must be a valid number' };
    }

    if (numAmount < this.validationRules.amount.min) {
      return { isValid: false, error: `Amount must be at least ${this.validationRules.amount.min}` };
    }

    if (numAmount > this.validationRules.amount.max) {
      return { isValid: false, error: `Amount cannot exceed ${this.validationRules.amount.max}` };
    }

    // Check decimal places
    const decimalPlaces = amount.toString().split('.')[1]?.length || 0;
    if (decimalPlaces > this.validationRules.amount.decimals) {
      return { isValid: false, error: `Amount cannot have more than ${this.validationRules.amount.decimals} decimal places` };
    }

    return { isValid: true, sanitized: numAmount };
  }

  // 🔒 Wallet Address Validation
  validateWalletAddress(address) {
    if (!address || typeof address !== 'string') {
      return { isValid: false, error: 'Wallet address is required and must be a string' };
    }

    const trimmedAddress = address.trim();
    
    if (trimmedAddress.length !== this.validationRules.walletAddress.length) {
      return { isValid: false, error: `Wallet address must be exactly ${this.validationRules.walletAddress.length} characters long` };
    }

    if (!this.validationRules.walletAddress.pattern.test(trimmedAddress)) {
      return { isValid: false, error: 'Invalid wallet address format' };
    }

    return { isValid: true, sanitized: trimmedAddress };
  }

  // 🔒 Transaction Hash Validation
  validateTransactionHash(hash) {
    if (!hash || typeof hash !== 'string') {
      return { isValid: false, error: 'Transaction hash is required and must be a string' };
    }

    const trimmedHash = hash.trim();
    
    if (trimmedHash.length !== this.validationRules.transactionHash.length) {
      return { isValid: false, error: `Transaction hash must be exactly ${this.validationRules.transactionHash.length} characters long` };
    }

    if (!this.validationRules.transactionHash.pattern.test(trimmedHash)) {
      return { isValid: false, error: 'Invalid transaction hash format' };
    }

    return { isValid: true, sanitized: trimmedHash };
  }

  // 🔒 Phone Number Validation
  validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, error: 'Phone number is required and must be a string' };
    }

    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    if (cleanedPhone.length < this.validationRules.phone.minLength) {
      return { isValid: false, error: `Phone number must be at least ${this.validationRules.phone.minLength} digits long` };
    }

    if (cleanedPhone.length > this.validationRules.phone.maxLength) {
      return { isValid: false, error: `Phone number must be no more than ${this.validationRules.phone.maxLength} digits long` };
    }

    if (!this.validationRules.phone.pattern.test(cleanedPhone)) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    return { isValid: true, sanitized: cleanedPhone };
  }

  // 🔒 HTML Sanitization
  sanitizeHTML(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    try {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: this.sanitizationRules.html.allowedTags,
        ALLOWED_ATTR: this.sanitizationRules.html.allowedAttributes,
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
      });
    } catch (error) {
      console.error('❌ HTML sanitization error:', error);
      return '';
    }
  }

  // 🔒 SQL Injection Prevention
  detectSQLInjection(input) {
    if (!input || typeof input !== 'string') {
      return { hasInjection: false };
    }

    const lowerInput = input.toLowerCase();
    
    // Check for SQL keywords
    for (const keyword of this.sanitizationRules.sql.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return { 
          hasInjection: true, 
          detected: keyword,
          error: 'Potential SQL injection detected' 
        };
      }
    }

    // Check for common SQL injection patterns
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(\b(where|from|join|or|and)\b.*\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(['"]\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s*)/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(lowerInput)) {
        return { 
          hasInjection: true, 
          detected: 'SQL pattern',
          error: 'Potential SQL injection detected' 
        };
      }
    }

    return { hasInjection: false };
  }

  // 🔒 XSS Prevention
  detectXSS(input) {
    if (!input || typeof input !== 'string') {
      return { hasXSS: false };
    }

    const lowerInput = input.toLowerCase();
    
    // Check for dangerous patterns
    for (const pattern of this.sanitizationRules.xss.dangerousPatterns) {
      if (pattern.test(lowerInput)) {
        return { 
          hasXSS: true, 
          detected: 'XSS pattern',
          error: 'Potential XSS attack detected' 
        };
      }
    }

    // Check for encoded XSS attempts
    const encodedPatterns = [
      /&#x?[0-9a-f]+;/gi,
      /%[0-9a-f]{2}/gi,
      /\\x[0-9a-f]{2}/gi,
      /\\u[0-9a-f]{4}/gi
    ];

    for (const pattern of encodedPatterns) {
      if (pattern.test(lowerInput)) {
        return { 
          hasXSS: true, 
          detected: 'Encoded XSS',
          error: 'Potential encoded XSS attack detected' 
        };
      }
    }

    return { hasXSS: false };
  }

  // 🔒 General Input Sanitization
  sanitizeInput(input, type = 'text') {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Check for injection attempts
    const sqlCheck = this.detectSQLInjection(sanitized);
    if (sqlCheck.hasInjection) {
      console.warn('⚠️ SQL injection attempt detected:', sqlCheck);
      return '';
    }

    const xssCheck = this.detectXSS(sanitized);
    if (xssCheck.hasXSS) {
      console.warn('⚠️ XSS attempt detected:', xssCheck);
      return '';
    }

    // Type-specific sanitization
    switch (type) {
      case 'html':
        return this.sanitizeHTML(sanitized);
      case 'email':
        return sanitized.toLowerCase();
      case 'phone':
        return sanitized.replace(/[^\d\+\-\(\)\s]/g, '');
      case 'number':
        return sanitized.replace(/[^\d\.\-]/g, '');
      case 'alphanumeric':
        return sanitized.replace(/[^a-zA-Z0-9]/g, '');
      default:
        return sanitized;
    }
  }

  // 🔒 Form Validation
  validateForm(formData, validationSchema) {
    const errors = {};
    const sanitizedData = {};

    for (const [field, rules] of Object.entries(validationSchema)) {
      const value = formData[field];
      
      // Required field check
      if (rules.required && (!value || value.trim() === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip validation if field is empty and not required
      if (!value || value.trim() === '') {
        sanitizedData[field] = '';
        continue;
      }

      // Type-specific validation
      let validationResult;
      switch (rules.type) {
        case 'email':
          validationResult = this.validateEmail(value);
          break;
        case 'password':
          validationResult = this.validatePassword(value);
          break;
        case 'username':
          validationResult = this.validateUsername(value);
          break;
        case 'amount':
          validationResult = this.validateAmount(value, rules.currency);
          break;
        case 'walletAddress':
          validationResult = this.validateWalletAddress(value);
          break;
        case 'transactionHash':
          validationResult = this.validateTransactionHash(value);
          break;
        case 'phone':
          validationResult = this.validatePhone(value);
          break;
        default:
          validationResult = { isValid: true, sanitized: this.sanitizeInput(value, rules.sanitize) };
      }

      if (!validationResult.isValid) {
        errors[field] = validationResult.error;
      } else {
        sanitizedData[field] = validationResult.sanitized;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }

  // 🔒 Rate Limiting Helper
  createRateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const attempts = new Map();

    return {
      checkLimit: (identifier) => {
        const now = Date.now();
        const userAttempts = attempts.get(identifier) || [];
        
        // Remove expired attempts
        const validAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
        
        if (validAttempts.length >= maxAttempts) {
          return { 
            allowed: false, 
            remaining: 0,
            resetTime: validAttempts[0] + windowMs 
          };
        }
        
        return { 
          allowed: true, 
          remaining: maxAttempts - validAttempts.length,
          resetTime: now + windowMs 
        };
      },
      
      recordAttempt: (identifier) => {
        const now = Date.now();
        const userAttempts = attempts.get(identifier) || [];
        userAttempts.push(now);
        attempts.set(identifier, userAttempts);
      },
      
      clearAttempts: (identifier) => {
        attempts.delete(identifier);
      }
    };
  }
}

// Export singleton instance
const validationService = new ValidationService();
export default validationService; 