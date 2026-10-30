import React, { useState } from 'react';
import { 
  User, Shield, Bell, Lock, MapPin, Mic, 
  HelpCircle, Info, ChevronRight, Edit3, Check 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSafety } from '../context/SafetyContext';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { distressPhrases, setDistressPhrases, locationPermission } = useSafety();

  const [name, setName] = useState(user?.name || 'Alex Chen');
  const [phone, setPhone] = useState(user?.phone || '+1 555-0199');
  const [medicalInfo, setMedicalInfo] = useState(user?.medical_info || 'Type O+, Asthma');
  const [emergencyNotes, setEmergencyNotes] = useState(user?.emergency_notes || '');
  const [phrasesInput, setPhrasesInput] = useState(distressPhrases.join(', '));
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({
        name,
        phone,
        medical_info: medicalInfo,
        emergency_notes: emergencyNotes
      });

      const parsed = phrasesInput.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (parsed.length > 0) {
        setDistressPhrases(parsed);
      }

      setSavedSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#0D3833] text-white flex items-center justify-center font-bold text-xl uppercase shadow-md">
            {name ? name.slice(0, 2) : 'AC'}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">{name}</h2>
            <p className="text-xs text-slate-400">Personal Safety Account • {user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-full border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          Profile updated successfully!
        </div>
      )}

      {/* Edit Form or List Menu */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Edit Personal Information</h3>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3833]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3833]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Medical Info / Blood Group</label>
            <input
              type="text"
              value={medicalInfo}
              onChange={(e) => setMedicalInfo(e.target.value)}
              placeholder="e.g. Asthma, Blood Group O+"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3833]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Guidance Notes</label>
            <textarea
              rows={2}
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
              placeholder="Passcode to apartment, emergency notes..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3833]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-[#0D3833] text-white font-bold text-xs sm:text-sm hover:bg-[#164E46] transition shadow-sm"
          >
            Save Changes
          </button>
        </form>
      ) : (
        /* Settings List Rows */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          <button
            onClick={() => setIsEditing(true)}
            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-slate-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">Personal Information</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <div className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">App Permissions (Location & Mic)</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {locationPermission.toUpperCase()}
            </span>
          </div>

          <div className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">Notification Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">Privacy & Data Controls</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-slate-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">About ESTELA</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">v1.2.0</span>
          </div>

        </div>
      )}

    </div>
  );
}
