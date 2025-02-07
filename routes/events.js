const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Event = require('../models/Event'); // Adjust the path to your model
const router = express.Router();
const multer = require("multer"); // ✅ Import multer
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Get all events (public route)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Create new event
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, date, category, location, imageUrl } = req.body;
    const userId = req.user.id;
    const newEvent = new Event({ title, description, date, category, location, creator: userId, imageUrl });
    await newEvent.save();
    res.status(201).json({ message: "Event created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit an event (protected route)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to edit this event' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an event (protected route)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this event' });
    }

    // Replace `event.remove()` with `Event.findByIdAndDelete`
    await Event.findByIdAndDelete(id);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Ensure Cloudinary Storage is Configured Correctly
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "event-images",
    format: async () => "png", // or jpg
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

const upload = multer({ storage });

// ✅ Image Upload Route
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image upload failed" });
    }
    res.json({ imageUrl: req.file.path });
  } catch (err) {
    console.error("Image Upload Error:", err);
    res.status(500).json({ error: "Internal server error while uploading image" });
  }
});

module.exports = router;
