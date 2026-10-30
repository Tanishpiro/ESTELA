import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * Safely parses response as JSON, falling back cleanly to text or meaningful error
 */
async function parseSafeResponse(res) {
  const text = await res.text();
  if (!text || !text.trim()) {
    return { data: null, error: `Server returned empty response (${res.status})` };
  }
  try {
    const data = JSON.parse(text);
    return { data, error: null };
  } catch (err) {
    // If response was HTML (like a 404 page), extract clean message
    if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
      return { data: null, error: `Server routing error (${res.status}): Endpoint not responding with JSON` };
    }
    return { data: null, error: text.slice(0, 150) };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('estela_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('estela_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Token verification failed');
          const { data } = await parseSafeResponse(res);
          if (data && isMounted) {
            setUser(data);
            localStorage.setItem('estela_user', JSON.stringify(data));
          }
        })
        .catch(() => {
          // Token invalid or network down, clear safely
          if (isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('estela_user');
            localStorage.removeItem('estela_token');
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    let res;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } catch (networkErr) {
      throw new Error('Unable to connect to safety server. Please check your internet connection.');
    }

    const { data, error: parseErr } = await parseSafeResponse(res);

    if (!res.ok) {
      const msg = data?.message || data?.error || parseErr || `Login failed (${res.status})`;
      throw new Error(msg);
    }

    if (!data || !data.user || !data.token) {
      throw new Error('Invalid authentication response from server.');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('estela_user', JSON.stringify(data.user));
    localStorage.setItem('estela_token', data.token);
    return data.user;
  };

  const register = async (userData) => {
    let res;
    try {
      res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
    } catch (networkErr) {
      throw new Error('Unable to connect to safety server. Please check your internet connection.');
    }

    const { data, error: parseErr } = await parseSafeResponse(res);

    if (!res.ok) {
      const msg = data?.message || data?.error || parseErr || `Registration failed (${res.status})`;
      throw new Error(msg);
    }

    if (!data || !data.user || !data.token) {
      throw new Error('Registration completed but server returned an invalid profile format.');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('estela_user', JSON.stringify(data.user));
    localStorage.setItem('estela_token', data.token);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('estela_user');
    localStorage.removeItem('estela_token');
  };

  const updateProfile = async (updates) => {
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    const { data } = await parseSafeResponse(res);
    if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to update profile');
    setUser(data);
    localStorage.setItem('estela_user', JSON.stringify(data));
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
