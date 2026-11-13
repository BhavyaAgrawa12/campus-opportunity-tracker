import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  BookOpen,
  MapPin,
  Target,
  Code2,
  Globe,
  Sparkles,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DOMAIN_OPTIONS = [
  'Web Development',
  'Frontend Development',
  'Backend Development',
  'Artificial Intelligence / ML',
  'Data Science & Analytics',
  'Cloud & DevOps',
  'Mobile App Development',
  'Cyber Security',
  'UI/UX Design',
];

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('Web Development');
  const [skills, setSkills] = useState('');
  const [education, setEducation] = useState('');
  const [location, setLocation] = useState('');
  const [preferredRole, setPreferredRole] = useState('');
  const [remotePreference, setRemotePreference] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDomain(user.domain || 'Web Development');
      setSkills(Array.isArray(user.skills) ? user.skills.join(', ') : '');
      setEducation(user.education || 'Poornima Group of Institutions');
      setLocation(user.location || 'Jaipur');
      setPreferredRole(user.preferred_role || user.domain || '');
      setRemotePreference(user.remote_preference ?? true);
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      await updateProfile({
        name,
        domain,
        skills: skillsArray,
        education,
        location,
        preferred_role: preferredRole,
        remote_preference: remotePreference,
      });

      setSuccess('Profile updated successfully! Personalized recommendations updated.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Student Profile & Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your education, technical skills, and target roles (PRD §FR-1.2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">College Email</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Education */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College / Degree
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. B.Tech CSE - Poornima University"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            {/* Domain */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Domain
              </label>
              <div className="relative">
                <Target className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                >
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Technical Skills (comma-separated)
              </label>
              <span className="text-[11px] text-slate-400">Used for match scoring</span>
            </div>
            <div className="relative">
              <Code2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. react, nodejs, python, fastapi, docker, typescript"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>
            {skills && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-700 rounded-md border border-brand-200"
                    >
                      #{skill}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preferred Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Job Role / Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Full Stack Engineer, ML Intern"
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Base Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Jaipur, Bengaluru, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                />
              </div>
            </div>
          </div>

          {/* Remote Preference Toggle */}
          <div className="pt-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs font-bold text-slate-800">Remote Work Preference</p>
                <p className="text-[11px] text-slate-500">
                  Prioritize remote opportunities alongside on-campus drives
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={remotePreference}
              onChange={(e) => setRemotePreference(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
