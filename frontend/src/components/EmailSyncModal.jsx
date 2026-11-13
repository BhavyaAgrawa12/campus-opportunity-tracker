import React, { useState, useEffect } from 'react';
import {
  Mail,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  Inbox
} from 'lucide-react';
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
    mailbox_folder: 'INBOX',
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
      const res = await api.syncDemoEmails();
      setMessage(res.message || 'Demo placement emails ingested successfully!');
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      setError(err.message || 'Failed to ingest sample placement emails.');
    } finally {
      setSyncingDemo(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!formData.password) {
      setError('Password or App Password is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.createEmailAccount(formData);
      setShowForm(false);
      setFormData((prev) => ({ ...prev, password: '' }));
      setMessage('Mailbox account securely connected with encrypted credentials!');
      await loadAccounts();
    } catch (err) {
      setError(err.message || 'Failed to connect email account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to disconnect this email account?')) return;
    try {
      await api.deleteEmailAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setMessage('Email account removed.');
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
    }
  };

  const handleSyncAccount = async (id) => {
    setSyncingAccountId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await api.syncEmailAccount(id);
      setMessage(res.message || 'Mailbox sync finished.');
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      setError(err.message || 'IMAP sync failed. Verify your App Password and IMAP settings.');
    } finally {
      setSyncingAccountId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Campus Email Integration (Phase 4)</h2>
              <p className="text-xs text-slate-500">Designated Student Mailbox & Placement Cell Parser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {message && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Simulator Box */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-indigo-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-indigo-900 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>One-Click Placement Drive Simulator</span>
              </div>
              <p className="text-xs text-indigo-700/80 mt-1 leading-relaxed">
                Test Poornima placement circulars instantly! Ingests sample RFC822 MIME emails: <b>TCS CodeVita Season 13</b>, <b>Smart Rajasthan Hackathon 2026</b>, and <b>Google Summer of Code (GSoC)</b> fellowship drive.
              </p>
            </div>
            <button
              onClick={handleDemoSync}
              disabled={syncingDemo}
              className="flex-shrink-0 flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingDemo ? 'animate-spin' : ''}`} />
              <span>{syncingDemo ? 'Ingesting...' : 'Ingest Sample Notices'}</span>
            </button>
          </div>
        </div>

        {/* Accounts Section */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-slate-500" />
              <span>Connected Mailboxes ({accounts.length})</span>
            </h3>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect Mailbox</span>
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleCreateAccount} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700">Add Designated Student Mailbox</span>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">College Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value, username: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="2023csbhavya14015@poornima.edu.in"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">IMAP App Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="16-character Google App Password"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">IMAP Server</label>
                  <input
                    type="text"
                    value={formData.imap_server}
                    onChange={(e) => setFormData({ ...formData, imap_server: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Folder to Monitor</label>
                  <input
                    type="text"
                    value={formData.mailbox_folder}
                    onChange={(e) => setFormData({ ...formData, mailbox_folder: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Encrypted at rest with Fernet cryptographic keys.</span>
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save & Protect'}
                </button>
              </div>
            </form>
          )}

          {/* Accounts List */}
          {accounts.length === 0 ? (
            <div className="p-6 bg-slate-50/70 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
              No live IMAP mailboxes connected yet. Click <b>"Ingest Sample Notices"</b> above to test the email opportunity parser immediately, or connect your college mailbox.
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">{acc.email}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        IMAP TLS (993)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Host: {acc.imap_server} · Folder: {acc.mailbox_folder}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSyncAccount(acc.id)}
                      disabled={syncingAccountId === acc.id}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingAccountId === acc.id ? 'animate-spin' : ''}`} />
                      <span>{syncingAccountId === acc.id ? 'Syncing...' : 'Sync'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-start space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p>
            <b>Privacy Guarantee (PRD §FR-4.1):</b> The system scans only opportunity announcements matching approved college senders and keywords. Raw email contents are never permanently stored or exposed.
          </p>
        </div>
      </div>
    </div>
  );
}
