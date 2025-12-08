import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import transporter from '../config/email.js';

// --- SIGNUP ---
export const signup = async (req, res) => {
  console.log('=== USER SIGNUP ===');
  const { username, email, password, confirmPassword } = req.body;
  
  // 1. Validation
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // 2. Check for duplicate email/username
    const isDuplicate = await User.checkDuplicate(email, username);
    
    if (isDuplicate) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    // 3. Create User
    const userId = await User.create({ username, email, password });
    console.log('User created with ID:', userId);
    
    res.status(201).json({ message: 'User created successfully', userId });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- LOGIN (With JWT Integration) ---
export const login = async (req, res) => {
  console.log('=== USER LOGIN ===');
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // 1. Find User
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // 3. Generate JWT Token (ITO ANG BAGO)
    const token = jwt.sign(
        { id: user.id, role: user.role }, // Payload: ID at Role
        process.env.SECRET,               // Secret key mula sa .env
        { expiresIn: '1d' }               // Token expiration
    );

    // 4. Return Token and User Data (Exclude password)
    const { password: pw, ...userData } = user;
    
    console.log('Login successful for:', userData.email);

    res.status(200).json({ 
        message: 'Login successful', 
        token,  // Ipapasa ito sa frontend
        user: userData 
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- LOGOUT ---
export const logout = async (req, res) => {
  console.log('=== USER LOGOUT ===');
  // Since JWT is stateless, logout is handled on frontend by removing the token.
  res.status(200).json({ message: 'Logged out successfully' });
};

// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
  console.log('=== FORGOT PASSWORD ===');
  
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    // Security practice: Always return success even if user not found to prevent email enumeration
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(200).json({ message: 'Reset link sent.' });
    }

    // 1. Generate Reset Token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 2. Save Token to DB
    await User.updateResetToken(user.id, token, expires);

    // 3. Create Link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetURL = `${frontendUrl}/reset-password?token=${token}`;

    // 4. Send Email
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
    
    console.log('Reset email sent to:', email);
    res.status(200).json({ message: 'Reset link sent.' });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- RESET PASSWORD ---
export const resetPassword = async (req, res) => {
  console.log('=== RESET PASSWORD ===');
  
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // 1. Find User by Token
    const user = await User.findByResetToken(token);

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }

    // 2. Update Password
    await User.updatePassword(user.id, password);
    console.log('Password updated for user ID:', user.id);
    
    res.status(200).json({ message: 'Password reset successful.' });

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GET ALL USERS (Optional/Admin only) ---
export const getAllUsers = async (req, res) => {
    // If you need this based on your routes, add logic here calling User model
    res.status(501).json({ message: "Not implemented yet" });
};