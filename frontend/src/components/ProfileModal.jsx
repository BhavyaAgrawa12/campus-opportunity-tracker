import React, { useState, useEffect } from 'react';
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
        .map((s) => s.trim())
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

      setSuccess('Profile updated successfully! Algorithmic match scores recalculated.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container-low border border-hairline rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container/20 border border-secondary/30 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                Student Profile & Match Matrix
              </h2>
              <p className="font-mono-micro text-mono-micro text-outline">
                PRD §FR-1: Powers Algorithmic Recommendations & Scoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-hairline transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error-container/20 border border-error/40 text-error rounded-xl text-body-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-tertiary-container/20 border border-tertiary/40 text-tertiary rounded-xl text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-body-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary"
                required
              />
            </div>

            <div>
              <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                Primary Domain / Specialization
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary capitalize"
              >
                {DOMAIN_OPTIONS.map((d) => (
                  <option key={d} value={d} className="bg-surface-container">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
              Skills (comma-separated tags)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Python, React, FastAPI, Docker, PyTorch"
              className="w-full px-3.5 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary font-mono-micro"
            />
            <span className="font-mono-micro text-mono-micro text-outline mt-1 block">
              Used to compute direct percentage overlap on job & hackathon cards.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                College / Institution
              </label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                Base Location / City
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                Preferred Target Role
              </label>
              <input
                type="text"
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
                placeholder="e.g. Full Stack Engineer, ML Intern"
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer text-body-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={remotePreference}
                  onChange={(e) => setRemotePreference(e.target.checked)}
                  className="rounded bg-surface-container border-hairline text-secondary focus:ring-0 cursor-pointer"
                />
                <span className="font-mono-micro text-mono-micro uppercase">
                  Prioritize Remote & Hybrid Opportunities
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-hairline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-hairline transition text-body-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-primary-container text-on-primary font-bold text-body-sm hover:brightness-110 active:scale-95 transition shadow-glow-primary"
            >
              {saving ? 'Updating Matrix...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
