import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/User.js';

// Generate 2FA secret and QR code
export const generateTwoFactorSecret = async (user) => {
  try {
    // Generate a secret
    const secret = speakeasy.generateSecret({
      name: 'friendflix',
      account: user.email,
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    throw error;
  }
};

// Verify 2FA token
export const verifyTwoFactorToken = (secret, token) => {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time windows (1 minute before/after)
    });

    return verified;
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    return false;
  }
};

// Generate backup codes
export const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Verify backup code
export const verifyBackupCode = async (userId, code) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    const index = user.twoFactorBackupCodes.indexOf(code);
    if (index === -1) return false;

    // Remove the used backup code
    user.twoFactorBackupCodes.splice(index, 1);
    await user.save();

    return true;
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return false;
  }
};

export default {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  generateBackupCodes,
  verifyBackupCode,
};