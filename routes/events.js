const express = require('express'); 
const Event  = require('../models/Event');
const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
    try {
      const events = await Event.find();
      res.status(200).json(events);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Create a new event
router.post('/', async (req, res) => {
    try {
      const { title, description, date } = req.body;
      const newEvent = new Event({ title, description, date });
      await newEvent.save();
      res.status(201).json({ message: 'Event created successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;