const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(409).json({ message: 'Username is already taken. Please choose a different one.' });
    }

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(409).json({ message: 'Email is already registered. Please use a different email.' });
    }

    // Hash password and save the user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    // Respond with success message
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    // Handle any other errors (database errors, unexpected errors)
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare the password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create a JWT token and send it to the user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({ token, user });
  } catch (err) {
    console.error(err);
    // Handle server errors
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

module.exports = router;
