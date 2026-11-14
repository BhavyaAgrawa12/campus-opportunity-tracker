import React, { useState } from 'react';
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
  const [skills, setSkills] = useState('React, Python, FastAPI');
  const [education, setEducation] = useState('Poornima Group of Institutions');
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
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-surface-container-low border border-hairline rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-hairline">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-micro text-mono-micro px-1.5 py-0.5 rounded bg-surface-container-high text-primary tracking-widest border border-hairline">
                RADAR // OP-TRACK
              </span>
              <span className="font-mono-micro text-mono-micro text-outline">
                {isRegister ? 'New Student Registration' : 'Cockpit Access'}
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
              {isRegister ? 'Initialize Pilot Profile' : 'Authenticate Credentials'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-hairline transition"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-body-sm">
          {error && (
            <div className="p-3 text-xs bg-error-container/20 border border-error/40 text-error rounded-xl">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bhavya Agrawal"
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>
          )}

          <div>
            <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
              Student / Placement Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. 2023csbhavya14015@poornima.edu.in"
              className="w-full px-3.5 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                    Primary Domain
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary text-xs"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Frontend Development">Frontend Development</option>
                    <option value="Backend Development">Backend Development</option>
                    <option value="Artificial Intelligence / ML">AI / ML</option>
                    <option value="Data Science & Analytics">Data Science</option>
                    <option value="Cyber Security">Cyber Security</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                    Campus Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Jaipur"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary text-xs"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Python, SQL"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-hairline text-on-surface focus:outline-none focus:border-secondary text-xs font-mono-micro"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary-container text-on-primary font-bold text-body-sm hover:brightness-110 active:scale-95 transition shadow-glow-primary flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Processing...' : isRegister ? 'Create Profile & Sign In' : 'Sign In to Cockpit'}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="px-6 py-4 bg-surface-container-lowest border-t border-hairline text-center text-mono-micro text-on-surface-variant">
          {isRegister ? (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-secondary font-bold hover:underline ml-1"
              >
                Sign in with credentials
              </button>
            </p>
          ) : (
            <p>
              New student at campus?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-secondary font-bold hover:underline ml-1"
              >
                Create new pilot profile
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
