/**
 * 🔐 Encryption Utilities
 * 
 * Encryption utilities pentru secure data storage:
 * - Encrypt sensitive data (private keys, etc.)
 * - Decrypt data
 * - Key management
 * 
 * @module encryption
 */

const crypto = require('crypto');

// Encryption key (from environment variable)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Encrypt data
 * @param {string} text - Data to encrypt
 * @returns {string} Encrypted data (hex string)
 */
function encrypt(text) {
  try {
    if (!text) {
      throw new Error('Text to encrypt is required');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine: salt + iv + tag + encrypted
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw error;
  }
}

/**
 * Decrypt data
 * @param {string} encryptedData - Encrypted data (hex string)
 * @returns {string} Decrypted data
 */
function decrypt(encryptedData) {
  try {
    if (!encryptedData) {
      throw new Error('Encrypted data is required');
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw error;
  }
}

/**
 * Hash data (one-way, pentru passwords, etc.)
 * @param {string} data - Data to hash
 * @returns {string} Hashed data
 */
function hash(data) {
  try {
    if (!data) {
      throw new Error('Data to hash is required');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
    
    return salt + ':' + hash;
  } catch (error) {
    console.error('Error hashing data:', error);
    throw error;
  }
}

/**
 * Verify hash
 * @param {string} data - Original data
 * @param {string} hashData - Hashed data (salt:hash)
 * @returns {boolean} True dacă match
 */
function verifyHash(data, hashData) {
  try {
    if (!data || !hashData) {
      return false;
    }

    const parts = hashData.split(':');
    if (parts.length !== 2) {
      return false;
    }

    const salt = parts[0];
    const hash = parts[1];
    
    const hashVerify = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
    
    return hash === hashVerify;
  } catch (error) {
    console.error('Error verifying hash:', error);
    return false;
  }
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  verifyHash
};

