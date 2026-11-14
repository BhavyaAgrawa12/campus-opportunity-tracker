import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EmailSyncModal({ isOpen, onClose, onSyncComplete }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncingDemo, setSyncingDemo] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // New account form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '2023csbhavya14015@poornima.edu.in',
    username: user?.email || '2023csbhavya14015@poornima.edu.in',
    password: '',
    provider: 'gmail',
    imap_server: 'imap.gmail.com',
    imap_port: 993,
    mailbox_folder: 'Nomination',
  });

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.getEmailAccounts();
      setAccounts(data || []);
    } catch (err) {
      console.error('Failed to load email accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSync = async () => {
    setSyncingDemo(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.syncDemoEmail();
      setMessage(
        `Simulation Ingested: ${res.ingested} opportunities parsed strictly from Poornima [Nomination] tagged emails.`
      );
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      setError(err.message || 'Failed to simulate email ingest');
    } finally {
      setSyncingDemo(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.createEmailAccount(formData);
      setShowForm(false);
      setFormData({
        email: '',
        username: '',
        password: '',
        provider: 'gmail',
        imap_server: 'imap.gmail.com',
        imap_port: 993,
        mailbox_folder: 'Nomination',
      });
      setMessage('Mailbox connected. Tag filter set to [Nomination].');
      loadAccounts();
    } catch (err) {
      setError(err.message || 'Failed to connect email account');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm('Disconnect this email account from the tracker?')) {
      try {
        await api.deleteEmailAccount(id);
        loadAccounts();
      } catch (err) {
        setError(err.message || 'Failed to delete account');
      }
    }
  };

  const handleSyncAccount = async (id) => {
    setSyncingAccountId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await api.syncEmailAccount(id);
      setMessage(`Mailbox synced: Ingested ${res.ingested} new [Nomination] tagged opportunities.`);
      if (onSyncComplete) onSyncComplete();
      loadAccounts();
    } catch (err) {
      setError(err.message || 'Failed to fetch from IMAP mailbox');
    } finally {
      setSyncingAccountId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container-low border border-hairline rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/20 border border-tertiary/30 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                Designated Mailbox Ingestion
              </h2>
              <p className="font-mono-micro text-mono-micro text-outline">
                PRD §FR-4: Restricted Tracking Strictly to [Nomination] Tagged Emails
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

        {/* Status Notification */}
        {message && (
          <div className="mt-4 p-3 bg-tertiary-container/20 border border-tertiary/40 text-tertiary rounded-xl text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-error-container/20 border border-error/40 text-error rounded-xl text-body-sm">
            {error}
          </div>
        )}

        {/* Security & Tag Filter Callout */}
        <div className="mt-4 p-3.5 rounded-xl bg-surface-container border border-hairline flex items-start gap-3">
          <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0 mt-0.5">
            verified_user
          </span>
          <div className="text-body-sm">
            <p className="font-semibold text-on-surface">
              Strict Tag Filter Active: <span className="text-primary font-mono-code font-bold">[Nomination]</span>
            </p>
            <p className="text-[12px] text-on-surface-variant mt-0.5">
              Only emails tagged with &ldquo;Nomination&rdquo; in subject, labels, or body are extracted. All credentials stored with Fernet AES-256 encryption.
            </p>
          </div>
        </div>

        {/* Simulation / Demo Ingest Button */}
        <div className="mt-4 p-4 rounded-xl bg-surface-container-high/40 border border-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono-micro text-mono-micro text-secondary font-bold uppercase tracking-wider block">
              POORNIMA PLACEMENT CELL SIMULATOR
            </span>
            <p className="text-body-sm text-on-surface font-medium mt-0.5">
              Simulate college inbox sync with verified Nomination circulars
            </p>
          </div>
          <button
            onClick={handleDemoSync}
            disabled={syncingDemo}
            className="px-4 py-2 rounded-lg bg-secondary-container text-on-secondary font-bold text-body-sm hover:brightness-110 active:scale-95 transition shadow-glow-secondary flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                syncingDemo ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span>{syncingDemo ? 'Ingesting...' : 'Ingest Nomination Emails'}</span>
          </button>
        </div>

        {/* Accounts List */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-mono-micro text-mono-micro text-on-surface-variant uppercase tracking-wider">
              Connected IMAP Accounts ({accounts.length})
            </h3>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="text-mono-micro text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Connect Account</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-6 text-center text-mono-micro text-outline">
              Loading accounts...
            </div>
          ) : accounts.length === 0 && !showForm ? (
            <div className="p-4 rounded-xl bg-surface-container border border-hairline text-center text-body-sm text-on-surface-variant">
              No IMAP accounts connected. You can use the Poornima Placement Cell Simulator above, or connect your student email.
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 rounded-xl bg-surface-container border border-hairline flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-secondary">
                    mail
                  </span>
                  <div>
                    <p className="font-body-sm font-semibold text-on-surface">
                      {acc.email}
                    </p>
                    <p className="font-mono-micro text-mono-micro text-outline">
                      {acc.imap_server}:{acc.imap_port} • Tag: {acc.mailbox_folder || 'Nomination'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSyncAccount(acc.id)}
                    disabled={syncingAccountId === acc.id}
                    className="px-2.5 py-1 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-secondary text-mono-micro border border-hairline transition"
                  >
                    {syncingAccountId === acc.id ? 'Syncing...' : 'Sync'}
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="p-1 rounded-md text-outline hover:text-error transition"
                    title="Disconnect account"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Account Form */}
        {showForm && (
          <form
            onSubmit={handleCreateAccount}
            className="mt-4 p-4 rounded-xl bg-surface-container border border-hairline space-y-3 text-body-sm animate-in fade-in"
          >
            <h4 className="font-headline-md text-body-md font-bold text-on-surface">
              Connect Google Workspace / IMAP Mailbox
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value, username: e.target.value })
                  }
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-highest border border-hairline text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                  App Password / Token
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="16-character app password"
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-highest border border-hairline text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                  IMAP Server
                </label>
                <input
                  type="text"
                  value={formData.imap_server}
                  onChange={(e) => setFormData({ ...formData, imap_server: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-highest border border-hairline text-on-surface focus:outline-none focus:border-secondary font-mono-micro"
                />
              </div>

              <div>
                <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.imap_port}
                  onChange={(e) =>
                    setFormData({ ...formData, imap_port: parseInt(e.target.value) || 993 })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-highest border border-hairline text-on-surface focus:outline-none focus:border-secondary font-mono-micro"
                />
              </div>

              <div>
                <label className="block font-mono-micro text-mono-micro text-on-surface-variant uppercase mb-1">
                  Mailbox Tag Filter
                </label>
                <input
                  type="text"
                  value={formData.mailbox_folder}
                  onChange={(e) => setFormData({ ...formData, mailbox_folder: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-surface-container-highest border border-hairline text-primary focus:outline-none focus:border-secondary font-mono-micro font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface text-body-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-primary-container text-on-primary font-bold text-body-sm hover:brightness-110 shadow-glow-primary"
              >
                Connect & Encrypt
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-hairline flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-hairline transition text-body-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
