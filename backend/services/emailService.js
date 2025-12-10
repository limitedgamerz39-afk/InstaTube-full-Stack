import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  // For development, use Ethereal.email for testing
  if (process.env.NODE_ENV === 'development') {
    // Only create transporter if we have valid credentials
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
    // Return null transporter for development without credentials
    return null;
  }
  
  // For production, use your email service (Gmail, SendGrid, etc.)
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  // Return null if no credentials are configured
  return null;
};

const transporter = createTransporter();

// Verify transporter configuration
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter error:', error);
    } else {
      console.log('✅ Email transporter is ready');
    }
  });
} else {
  console.log('⚠️ Email transporter not configured - emails will not be sent');
}

// Send verification email
export const sendVerificationEmail = async (email, verificationToken) => {
  // If no transporter is configured, skip sending email
  if (!transporter) {
    console.log('⚠️ Email service not configured - skipping verification email');
    return { messageId: 'no-transporter' };
  }
  
  try {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"D4D HUB" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your D4D HUB account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4361ee;">Welcome to D4D HUB!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4361ee; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account with D4D HUB, please ignore this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  // If no transporter is configured, skip sending email
  if (!transporter) {
    console.log('⚠️ Email service not configured - skipping password reset email');
    return { messageId: 'no-transporter' };
  }
  
  try {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"D4D HUB" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your D4D HUB password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4361ee;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4361ee; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};

// Send notification email
export const sendNotificationEmail = async (email, subject, message) => {
  // If no transporter is configured, skip sending email
  if (!transporter) {
    console.log('⚠️ Email service not configured - skipping notification email');
    return { messageId: 'no-transporter' };
  }
  
  try {
    const mailOptions = {
      from: `"D4D HUB" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4361ee;">D4D HUB Notification</h2>
          <p>${message}</p>
          <hr style="margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            You received this email because you're subscribed to D4D HUB notifications.
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/settings/notifications">Manage notifications</a>
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Notification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending notification email:', error);
    throw error;
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail
};