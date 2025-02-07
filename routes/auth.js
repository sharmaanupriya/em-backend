const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const usernameNormalized = username.trim().toLowerCase();
    const emailNormalized = email.trim().toLowerCase();

    // Check if the user already exists
    const existingUserByUsername = await User.findOne({ username: usernameNormalized });
    if (existingUserByUsername) {
      return res.status(409).json({ message: 'Username is already taken. Please choose a different one.' });
    }

    const existingUserByEmail = await User.findOne({ email: emailNormalized });
    if (existingUserByEmail) {
      return res.status(409).json({ message: 'Email is already registered. Please use a different email.' });
    }

    // Password complexity validation
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and include one uppercase letter, one number, and one special character.',
      });
    }

    // Hash password and save the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username: usernameNormalized, email: emailNormalized, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create a JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email }, // ✅ Ensure username is included
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log("✅ Login API - User Data:", user); // ✅ Debug API response

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,  // ✅ Ensure correct username is returned
        email: user.email
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});


module.exports = router;
