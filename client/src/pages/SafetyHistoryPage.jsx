import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, CheckCircle, Bell, Trash2, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SafetyHistoryPage() {
  const { token } = useAuth();
  const [history, setHistory] = useState({ sessions: [], incidents: [], checkins: [], notifications: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, sessions, sos, missed

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  // Combine items into unified timeline
  const timelineItems = [];

  history.sessions.forEach(s => {
    timelineItems.push({
      id: s.id,
      title: s.title || 'Safety session',
      subtitle: `${new Date(s.started_at).toLocaleDateString()}, ${new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${s.duration_minutes} min`,
      tag: s.status === 'completed' ? 'Completed' : s.status === 'overdue' ? 'Overdue' : 'Active',
      tagColor: s.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800',
      type: 'session',
      date: new Date(s.started_at)
    });
  });

  history.incidents.forEach(inc => {
    const isSos = inc.type === 'SOS';
    timelineItems.push({
      id: inc.id,
      title: isSos ? 'SOS Triggered' : 'Missed check-in',
      subtitle: `${new Date(inc.created_at).toLocaleDateString()}, ${new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${inc.address_approx || 'GPS logged'}`,
      tag: inc.status === 'RESOLVED' ? 'Resolved' : 'Active',
      tagColor: inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800',
      type: isSos ? 'sos' : 'missed',
      date: new Date(inc.created_at)
    });
  });

  // Sort descending
  timelineItems.sort((a, b) => b.date - a.date);

  const filteredItems = timelineItems.filter(item => {
    if (filter === 'sessions') return item.type === 'session';
    if (filter === 'sos') return item.type === 'sos';
    if (filter === 'missed') return item.type === 'missed';
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Session History
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review past safety sessions, check-ins, and emergency alerts.
        </p>
      </div>

      {/* Pill Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        {[
          { key: 'all', label: 'All' },
          { key: 'sessions', label: 'Safety Sessions' },
          { key: 'sos', label: 'SOS Events' },
          { key: 'missed', label: 'Missed Check-ins' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full transition ${
              filter === tab.key
                ? 'bg-[#0D3833] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-5 flex items-center justify-between hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                item.type === 'sos'
                  ? 'bg-red-50 text-red-600'
                  : item.type === 'missed'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-700'
              }`}>
                {item.type === 'sos' ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : item.type === 'missed' ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.tagColor}`}>
                {item.tag}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            No history found in this category.
          </div>
        )}
      </div>

    </div>
  );
}
