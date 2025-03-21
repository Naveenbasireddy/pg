import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import db from '../config/db.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await db.query(
      'SELECT * FROM admin WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length === 0) {
      console.log('Login failed for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    console.log('Login successful for email:', email);
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate and send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verify if email exists
    const [user] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expiry = new Date(Date.now() + 10 * 60000); // 10 minutes

    await db.query(
      'UPDATE admin SET otp = ?, otp_expiry = ? WHERE email = ?',
      [otp, otp_expiry, email]
    );

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'naveenbasireddy2001@gmail.com',
        pass: 'cpuw jcqt sntv tgnm'  // Your app password
      }
    });

    // Send OTP email
    const mailOptions = {
      from: 'naveenbasireddy2001@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}\nThis OTP will expire in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM admin WHERE email = ? AND otp = ? AND otp_expiry > NOW()',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await db.query(
      'UPDATE admin SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?',
      [newPassword, email]
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;