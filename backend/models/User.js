const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['patient', 'doctor'], 
    default: 'patient' 
  },
  // Doctor specific fields
  specialization: { type: String },
  qualifications: { type: String },
  experience: { type: String },
  consultationFee: { type: String },
  availability: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);