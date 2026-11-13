import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bookmark,
  Briefcase,
  Compass,
  LogIn,
  LogOut,
  Mail,
  Sliders,
  Bell,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenAuth,
  savedCount,
  applicationsCount,
  onOpenEmailModal,
  onOpenAdminModal,
  onSelectOpportunityId,
  onOpenProfile,
}) {
  const { user, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsData, setNotificationsData] = useState({ unread_count: 0, notifications: [] });
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 60000); // refresh every min
      return () => clearInterval(interval);
    } else {
      setNotificationsData({ unread_count: 0, notifications: [] });
    }
  }, [user]);

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await api.getNotifications();
      setNotificationsData(res || { unread_count: 0, notifications: [] });
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = (item) => {
    setNotificationsOpen(false);
    if (item.opportunity_id && onSelectOpportunityId) {
      onSelectOpportunityId(item.opportunity_id);
    } else if (item.action_url) {
      window.open(item.action_url, '_blank');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('explore')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Campus Opportunity Tracker
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 rounded-full border border-brand-200">
                Poornima Edition
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'explore'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => setActiveTab('recommended')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recommended'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>For You</span>
            </button>


            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'saved'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-brand-600 text-white rounded-full">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'applications'
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Application Tracker</span>
              {applicationsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                  {applicationsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Tools & Auth */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Campus Email Parser Trigger */}
            <button
              onClick={onOpenEmailModal}
              title="Campus Email Ingestion (Phase 4)"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold border border-amber-200 transition shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden lg:inline">Campus Email</span>
            </button>

            {/* Admin Sources Management Trigger */}
            <button
              onClick={onOpenAdminModal}
              title="Scraper Engine Management (Phase 7)"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-semibold border border-indigo-200 transition shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Sources</span>
            </button>

            {/* In-App Notifications (PRD §FR-8) */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  title="Notifications & Alerts"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition"
                >
                  <Bell className="w-4 h-4" />
                  {notificationsData.unread_count > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>

                {/* Notifications Popover */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in duration-100">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-brand-600" />
                        <h4 className="text-xs font-bold text-slate-900">Notifications & Alerts</h4>
                      </div>
                      <span className="text-[11px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                        {notificationsData.unread_count} new
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                      {notificationsData.notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No new notifications. Save opportunities to track deadlines!
                        </div>
                      ) : (
                        notificationsData.notifications.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition hover:scale-[1.01] ${
                              item.severity === 'danger'
                                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                                : item.severity === 'warning'
                                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-bold flex items-center space-x-1">
                                {item.severity === 'danger' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                                {item.severity === 'warning' && <Clock className="w-3 h-3 text-amber-600" />}
                                {item.severity === 'info' && <Sparkles className="w-3 h-3 text-brand-600" />}
                                {item.severity === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                <span>{item.title}</span>
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                              {item.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Auth Action */}
            {user ? (
              <div className="flex items-center space-x-2 pl-1 border-l border-slate-200">
                <button
                  onClick={onOpenProfile}
                  title="Edit Profile & Preferences"
                  className="flex items-center space-x-2 p-1 hover:bg-slate-100 rounded-xl transition text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-300 flex items-center justify-center text-brand-800 font-bold text-xs group-hover:scale-105 transition">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden xl:block text-left text-xs">
                    <p className="font-semibold text-slate-900 leading-tight group-hover:text-brand-600 transition">{user.name}</p>
                    <p className="text-slate-500">{user.domain || 'Student'}</p>
                  </div>
                </button>
                <button
                  onClick={logout}

                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden border-t border-slate-100 py-2 justify-around">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'explore' ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore</span>
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'recommended' ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>For You</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'saved' ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({savedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === 'applications' ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Tracker ({applicationsCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
