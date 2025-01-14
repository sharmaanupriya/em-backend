const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path to your User model

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const token =
      req.header('Authorization')?.split(' ')[1] || req.cookies?.token; // Check both header and cookies
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your secret
    req.user = decoded; // Attach the decoded user information to the request object

    // Optional: Validate the user exists in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token: user not found' });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    console.error('Auth Middleware Error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
