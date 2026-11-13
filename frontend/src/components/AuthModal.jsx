import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, BookOpen, MapPin, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('Web Development');
  const [skills, setSkills] = useState('react, nodejs, python');
  const [education, setEducation] = useState('B.Tech CSE - Poornima University');
  const [location, setLocation] = useState('Jaipur');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const skillsArray = skills
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        await register({
          name,
          email,
          password,
          domain,
          skills: skillsArray,
          education,
          location,
          preferred_role: domain,
        });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {isRegister ? 'Create your Student Account' : 'Welcome Back'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRegister
                ? 'Personalize your feed and track opportunities'
                : 'Sign in to access saved items & applications'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhavya Agrawal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder={isRegister ? '2023cs...@poornima.edu.in' : 'name@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>
            {isRegister && (
              <span className="text-[11px] text-slate-400">At least 8 characters</span>
            )}
          </div>

          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain</label>
                  <div className="relative">
                    <Target className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                    >
                      <option value="Software Development">Software Dev</option>
                      <option value="AI/ML">AI / Machine Learning</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Cloud / DevOps">Cloud / DevOps</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Data Science">Data Science</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Jaipur"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="python, react, fastapi, sql"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Education</label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="B.Tech CSE - Poornima University"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-brand-500/25 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>

          <div className="pt-2 text-center text-xs text-slate-500 space-y-2">
            <div>
              {isRegister ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError('');
                    }}
                    className="text-brand-600 font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                    }}
                    className="text-brand-600 font-semibold hover:underline"
                  >
                    Create one now
                  </button>
                </span>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-[11px] underline transition"
              >
                Continue browsing opportunities as guest →
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
