import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const User = {
  // Create new user
  async create(userData) {
    const { username, email, password, role = 'customer' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(
      'INSERT INTO UserDb (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    return result.insertId;
  },

  // Find user by email
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM UserDb WHERE email = ?', [email]);
    return rows[0];
  },

  // 👇 ITO ANG KULANG MO! (Importante ito sa Middleware)
  async findById(id) {
    const [rows] = await db.query('SELECT * FROM UserDb WHERE id = ?', [id]);
    return rows[0];
  },
  // 👆 ------------------------------------------------

  // Find user by reset token
  async findByResetToken(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await db.query(
      'SELECT * FROM UserDb WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()',
      [hashedToken]
    );
    return rows[0];
  },

  // Update user reset token
  async updateResetToken(userId, token, expires) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    await db.query(
      'UPDATE UserDb SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?',
      [hashedToken, expires, userId]
    );
  },

  // Update password
  async updatePassword(userId, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'UPDATE UserDb SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?',
      [hashedPassword, userId]
    );
  },

  // Check if email or username exists
  async checkDuplicate(email, username) {
    const [rows] = await db.query(
      'SELECT * FROM UserDb WHERE email = ? OR username = ?',
      [email, username]
    );
    return rows.length > 0;
  }
};

export default User;