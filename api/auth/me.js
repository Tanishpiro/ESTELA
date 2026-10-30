import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'estela_super_secret_safety_key_2026';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = global._estela_users ? global._estela_users.get(decoded.email) : null;
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      medical_info: user.medical_info,
      emergency_notes: user.emergency_notes
    });
  } catch (e) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}
