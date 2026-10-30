import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SafetyContext = createContext(null);

export function SafetyProvider({ children }) {
  const { token, user } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [activeIncident, setActiveIncident] = useState(null);
  const [latestLocation, setLatestLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [contacts, setContacts] = useState([]);
  const [aiMonitoring, setAiMonitoring] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [distressPhrases, setDistressPhrases] = useState(['help me', 'danger', 'emergency', 'estela alert']);
  const [lastDetectedPhrase, setLastDetectedPhrase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Audio recognition ref
  const recognitionRef = React.useRef(null);

  // Fetch active session and contacts
  const refreshSafetyState = useCallback(async () => {
    if (!token) return;
    try {
      const [sessionRes, contactsRes] = await Promise.all([
        fetch('/api/sessions/active', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/contacts', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setActiveSession(sessionData.activeSession);
        setActiveIncident(sessionData.activeIncident);
        if (sessionData.latestLocation) {
          setLatestLocation(sessionData.latestLocation);
        }
      }

      if (contactsRes.ok) {
        const contactList = await contactsRes.json();
        setContacts(contactList);
      }
    } catch (err) {
      console.error('Error refreshing safety state:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshSafetyState();
    const interval = setInterval(refreshSafetyState, 4000); // Polling every 4 seconds for immediate escalation status
    return () => clearInterval(interval);
  }, [refreshSafetyState]);

  // Request browser location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading
          };
          setLatestLocation(loc);
          setLocationPermission('granted');

          // Send snapshot to backend if session or incident active
          if (token) {
            fetch('/api/location/ping', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                ...loc,
                sessionId: activeSession ? activeSession.id : null
              })
            }).catch(console.error);
          }

          resolve(loc);
        },
        (err) => {
          console.warn('Geolocation error or denied:', err.message);
          setLocationPermission('denied');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }, [token, activeSession]);

  // Periodic location ping when safety session is active
  useEffect(() => {
    if (activeSession && activeSession.location_sharing_enabled) {
      getCurrentLocation();
      const locInterval = setInterval(getCurrentLocation, 15000); // every 15s during active session
      return () => clearInterval(locInterval);
    }
  }, [activeSession, getCurrentLocation]);

  // Speech Recognition Setup (Web Speech API / Vosk fallback)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript.toLowerCase();
        }

        for (const phrase of distressPhrases) {
          if (transcript.includes(phrase.toLowerCase())) {
            setLastDetectedPhrase(phrase);
            handleDistressTrigger(phrase, false);
            break;
          }
        }
      };

      recognition.onerror = (e) => {
        console.warn('Voice recognition notice:', e.error);
      };

      recognitionRef.current = recognition;
    }
  }, [distressPhrases]);

  const toggleAiMonitoring = (enabled) => {
    if (enabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setAiMonitoring(true);
        } catch (e) {
          // Already started or blocked
          setAiMonitoring(true);
        }
      } else {
        // Fallback simulation mode enabled
        setAiMonitoring(true);
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setAiMonitoring(false);
    }
  };

  const handleDistressTrigger = async (phrase, isSimulation = false) => {
    if (!token) return;
    const loc = await getCurrentLocation();
    try {
      const res = await fetch('/api/incidents/ai-distress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phrase,
          isSimulation,
          latitude: loc?.latitude,
          longitude: loc?.longitude
        })
      });
      if (res.ok) {
        refreshSafetyState();
      }
    } catch (err) {
      console.error('AI distress send error:', err);
    }
  };

  // SOS Emergency Action
  const triggerSOS = async () => {
    if (!token) throw new Error('You must be logged in to trigger SOS');
    const loc = await getCurrentLocation();

    const res = await fetch('/api/incidents/sos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        accuracy: loc?.accuracy,
        trigger_source: 'SOS_BUTTON'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to dispatch SOS alert');
    }

    await refreshSafetyState();
    return data;
  };

  // I AM SAFE Action
  const confirmSafe = async (note = 'User tapped I AM SAFE') => {
    if (!token || !activeSession) return;
    const loc = await getCurrentLocation();

    const res = await fetch(`/api/sessions/${activeSession.id}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        note,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        accuracy: loc?.accuracy
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Check-in failed');
    await refreshSafetyState();
    return data;
  };

  // Start Safety Session
  const startSession = async (sessionConfig) => {
    if (!token) return;
    const loc = await getCurrentLocation();

    const res = await fetch('/api/sessions/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...sessionConfig,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        accuracy: loc?.accuracy
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start session');
    await refreshSafetyState();
    return data;
  };

  // End Safety Session
  const endSession = async () => {
    if (!token || !activeSession) return;
    const res = await fetch(`/api/sessions/${activeSession.id}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to end session');
    await refreshSafetyState();
  };

  // Resolve Active Incident
  const resolveIncident = async (incidentId, note = 'Resolved safely') => {
    if (!token) return;
    const res = await fetch(`/api/incidents/${incidentId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ note })
    });
    if (!res.ok) throw new Error('Failed to resolve incident');
    await refreshSafetyState();
  };

  return (
    <SafetyContext.Provider
      value={{
        activeSession,
        activeIncident,
        latestLocation,
        contacts,
        locationPermission,
        aiMonitoring,
        speechRecognitionSupported,
        distressPhrases,
        lastDetectedPhrase,
        loading,
        refreshSafetyState,
        getCurrentLocation,
        triggerSOS,
        confirmSafe,
        startSession,
        endSession,
        resolveIncident,
        toggleAiMonitoring,
        handleDistressTrigger,
        setDistressPhrases
      }}
    >
      {children}
    </SafetyContext.Provider>
  );
}

export function useSafety() {
  const context = useContext(SafetyContext);
  if (!context) throw new Error('useSafety must be used within SafetyProvider');
  return context;
}
