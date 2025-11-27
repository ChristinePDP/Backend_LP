import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import transporter from '../config/email.js';

export const signup = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Check for duplicate email or username
    const isDuplicate = await User.checkDuplicate(email, username);
    if (isDuplicate) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    const userId = await User.create({ username, email, password });
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const { password: pw, ...userData } = user;
    res.json({ message: 'Login successful', user: userData });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = async (req, res) => {
  // If using cookies in future: res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findByEmail(email);

    if (!user) {
      console.log("Forgot Password: User not found for email:", email);
      return res.status(200).json({ message: 'Reset link sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    console.log("Updating user token for ID:", user.id);

    await User.updateResetToken(user.id, token, expires);

    // Dynamic URL for Deployment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetURL = `${frontendUrl}/reset-password?token=${token}`; 

    console.log("Attempting to send email to:", user.email);

    await transporter.sendMail({
      from: `"La Piscina" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your La Piscina account.</p>
          <p>Click the button below to set a new password (link expires in 15 minutes):</p>
          <a href="${resetURL}" target="_blank" style="background-color: #F57C00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    console.log("Email sent successfully");
    res.status(200).json({ message: 'Reset link sent.' });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    if (err.code === 'ER_BAD_FIELD_ERROR') {
        console.error("POSSIBLE CAUSE: Missing columns in UserDb.");
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const user = await User.findByResetToken(token);

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }

    await User.updatePassword(user.id, password);

    res.status(200).json({ message: 'Password reset successful.' });

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};