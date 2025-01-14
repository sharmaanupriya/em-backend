const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  category: { type: String, required: true },
  location: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Event', EventSchema);
