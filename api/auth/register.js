import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'estela_super_secret_safety_key_2026';

if (!global._estela_users) {
  global._estela_users = new Map();
  global._estela_contacts = new Map();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { name, email, password, phone, medical_info, emergency_notes } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (global._estela_users.has(cleanEmail)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      phone: (phone || '').trim(),
      medical_info: (medical_info || '').trim(),
      emergency_notes: (emergency_notes || '').trim(),
      createdAt: new Date().toISOString()
    };

    global._estela_users.set(cleanEmail, newUser);

    const token = jwt.sign({ id: userId, email: cleanEmail, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Safety account created successfully',
      user: {
        id: userId,
        name: newUser.name,
        email: cleanEmail,
        phone: newUser.phone,
        medical_info: newUser.medical_info,
        emergency_notes: newUser.emergency_notes
      },
      token
    });
  } catch (err) {
    console.error('Registration handler error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
}
