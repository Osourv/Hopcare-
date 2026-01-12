const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import Models
const User = require('./models/User');
const Appointment = require('./models/Appointment');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hopcare';

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Rule-Based AI Logic Database ---
const CONDITIONS_DB = [
  { keywords: ['headache', 'migraine', 'light', 'sensitivity', 'nausea', 'dizzy'], prediction: "Migraine", specialist: "Neurologist", recommendation: "Rest in a dark, quiet room. Stay hydrated and avoid screens." },
  { keywords: ['fever', 'cold', 'cough', 'runny', 'sneeze', 'throat', 'congestion'], prediction: "Viral Infection / Flu", specialist: "General Physician", recommendation: "Rest, drink plenty of fluids, and monitor temperature. Isolate if contagious." },
  { keywords: ['chest', 'pain', 'heart', 'breath', 'pressure', 'tight'], prediction: "Potential Cardiac Issue", specialist: "Cardiologist", recommendation: "Seek immediate medical attention if pain is severe. Consult a cardiologist." },
  { keywords: ['skin', 'rash', 'itch', 'redness', 'dry', 'bump'], prediction: "Dermatitis / Skin Allergy", specialist: "Dermatologist", recommendation: "Avoid irritants, keep area clean and moisturized. Do not scratch." },
  { keywords: ['stomach', 'pain', 'digest', 'acid', 'bloat', 'vomit', 'diarrhea'], prediction: "Gastritis / Indigestion", specialist: "Gastroenterologist", recommendation: "Avoid spicy/oily foods, eat smaller meals, and stay hydrated." },
  { keywords: ['joint', 'pain', 'knee', 'back', 'stiff', 'bone', 'muscle'], prediction: "Arthritis / Muscular Strain", specialist: "Orthopedist", recommendation: "Rest affected area, apply ice/heat as needed. Avoid heavy lifting." },
  { keywords: ['tooth', 'gum', 'pain', 'mouth', 'bleed', 'sensitive'], prediction: "Dental Issue", specialist: "Dentist", recommendation: "Rinse with warm salt water and schedule a dental visit." },
  { keywords: ['vision', 'eye', 'blur', 'see', 'red', 'watery'], prediction: "Vision / Eye Strain", specialist: "Ophthalmologist", recommendation: "Rest eyes, follow the 20-20-20 rule. Avoid rubbing eyes." },
  { keywords: ['ear', 'hear', 'pain', 'ring', 'wax'], prediction: "Ear Infection / Tinnitus", specialist: "ENT Specialist", recommendation: "Keep ear dry, do not insert objects. Consult an ENT if pain persists." },
  { keywords: ['sad', 'anxiety', 'depress', 'mood', 'sleep', 'worry', 'panic'], prediction: "Anxiety / Stress", specialist: "Psychiatrist", recommendation: "Practice deep breathing and relaxation techniques. Talk to a professional." }
];

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
};

// --- Routes ---

// 1. Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, specialization, qualifications, experience, consultationFee } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name, email, password: hashedPassword, role, phone,
      specialization, qualifications, experience, consultationFee,
      availability: role === 'doctor' ? ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] : []
    });

    const savedUser = await newUser.save();
    
    // Generate Token
    const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, JWT_SECRET);

    res.json({
      token,
      user: { id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);

    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        specialization: user.specialization,
        availability: user.availability
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Get All Doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Get Appointments (For Patient or Doctor)
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'doctor') {
      query.doctorId = req.user.id;
    } else {
      query.patientId = req.user.id;
    }
    
    const appointments = await Appointment.find(query).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Create Appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    const saved = await newAppointment.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Update Appointment Status
app.put('/api/appointments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. Update User Profile
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Unauthorized' });
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. AI Symptom Checker (Rule-Based)
app.post('/api/ai/predict', authenticateToken, async (req, res) => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ message: "Symptoms required" });

    const lowerSymptoms = symptoms.toLowerCase();
    let bestMatch = null;
    let maxCount = 0;

    for (const condition of CONDITIONS_DB) {
      const count = condition.keywords.filter(k => lowerSymptoms.includes(k)).length;
      if (count > maxCount) {
        maxCount = count;
        bestMatch = condition;
      }
    }

    // Simulate "Processing" delay for UX
    await new Promise(r => setTimeout(r, 800));

    if (bestMatch && maxCount > 0) {
      res.json({
        prediction: bestMatch.prediction,
        confidence: maxCount >= 3 ? "High" : "Medium",
        recommendation: bestMatch.recommendation,
        specialist: bestMatch.specialist
      });
    } else {
      res.json({
        prediction: "General Symptoms",
        confidence: "Low",
        recommendation: "Your symptoms are nonspecific. Please consult a General Physician for a complete checkup.",
        specialist: "General Physician"
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));