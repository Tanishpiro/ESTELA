import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit3, Shield, Mail, Phone, Check, AlertCircle } from 'lucide-react';
import { useSafety } from '../context/SafetyContext';
import { useAuth } from '../context/AuthContext';

export default function ContactsPage() {
  const { contacts, refreshSafetyState } = useSafety();
  const { token } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Family',
    phone: '',
    email: '',
    role: 'primary',
    notify_on_missed_checkin: true,
    notify_on_sos: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: 'Family',
      phone: '',
      email: '',
      role: 'general',
      notify_on_missed_checkin: true,
      notify_on_sos: true
    });
    setEditingContact(null);
    setError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      relationship: contact.relationship || 'Friend',
      phone: contact.phone,
      email: contact.email,
      role: contact.role || 'general',
      notify_on_missed_checkin: !!contact.notify_on_missed_checkin,
      notify_on_sos: !!contact.notify_on_sos
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';
      const method = editingContact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      let data = {};
      try {
        const text = await res.text();
        if (text && text.trim()) {
          data = JSON.parse(text);
        }
      } catch (e) {
        data = {};
      }

      if (!res.ok) throw new Error(data.error || 'Failed to save contact');

      await refreshSafetyState();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this trusted contact?')) return;
    try {
      await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshSafetyState();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Informational Blue / Green Shield Alert Banner */}
      <div className="p-4 rounded-2xl bg-[#E8F4F1] border border-emerald-100 flex items-center gap-3 text-xs text-[#0D3833]">
        <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <span>Your trusted contacts will be notified during safety sessions and if you trigger SOS.</span>
      </div>

      {/* Contacts List Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        
        <div className="divide-y divide-slate-100">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-5 flex items-center justify-between hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#0D3833] text-white flex items-center justify-center font-bold text-sm uppercase shadow-xs">
                  {contact.name.slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{contact.name}</h4>
                  <p className="text-xs text-emerald-700 font-semibold">
                    {contact.role === 'primary' ? 'Primary contact' : contact.role === 'backup' ? 'Backup contact' : 'General guardian'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{contact.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(contact)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {contacts.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No contacts configured yet. Add one below.
            </div>
          )}
        </div>

        {/* Add Contact Row Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleOpenAdd}
            className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            Add Trusted Contact
          </button>
        </div>

      </div>

      {/* Modal for Add / Edit */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingContact ? 'Edit Trusted Contact' : 'Add Trusted Contact'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Alerts will only be sent during active emergencies or missed safety deadlines.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Lee"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3833]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    placeholder="Sister / Friend"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3833]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3833]"
                  >
                    <option value="primary">Primary Contact</option>
                    <option value="backup">Backup Contact</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3833]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sarah@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3833]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full py-3 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-[#0D3833] text-white text-xs font-bold hover:bg-[#164E46] transition"
                >
                  {loading ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
