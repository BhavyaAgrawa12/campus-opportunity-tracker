import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import UrgencyTicker from './components/UrgencyTicker';
import PrimeMatchHero from './components/PrimeMatchHero';
import MetricsOverview from './components/MetricsOverview';
import FiltersBar from './components/FiltersBar';
import OpportunityCard from './components/OpportunityCard';
import OpportunityDetailModal from './components/OpportunityDetailModal';
import DeadlineSidebar from './components/DeadlineSidebar';
import ApplicationTracker from './components/ApplicationTracker';
import CrawlerTopologyView from './components/CrawlerTopologyView';
import CommandPaletteModal from './components/CommandPaletteModal';
import AuthModal from './components/AuthModal';
import EmailSyncModal from './components/EmailSyncModal';
import AdminSourcesModal from './components/AdminSourcesModal';
import ProfileModal from './components/ProfileModal';
import { api } from './api/client';
import { useAuth } from './context/AuthContext';

function computeMatch(opp, user) {
  if (!user) return { matchScore: 0, matchedSkills: [] };

  let score = 0;
  const oppSkills = (opp.skills || []).map((s) => s.toLowerCase());
  const oppText = `${opp.title} ${opp.description || ''} ${opp.organization} ${opp.domain || ''}`.toLowerCase();
  const userSkills = (user.skills || []).map((s) => s.toLowerCase());

  // 1. Skill overlap (up to 50 pts)
  const matchedSkills = [];
  userSkills.forEach((skill) => {
    if (oppSkills.some((os) => os.includes(skill) || skill.includes(os)) || oppText.includes(skill)) {
      matchedSkills.push(skill);
    }
  });

  if (userSkills.length > 0) {
    const skillRatio = Math.min(1, matchedSkills.length / Math.max(1, Math.min(userSkills.length, 3)));
    score += Math.round(skillRatio * 50);
  }

  // 2. Domain match (up to 30 pts)
  if (user.domain && opp.domain) {
    const uDomain = user.domain.toLowerCase();
    const oDomain = opp.domain.toLowerCase();
    if (uDomain.includes(oDomain) || oDomain.includes(uDomain)) {
      score += 30;
    } else if (oppText.includes(uDomain)) {
      score += 20;
    }
  }

  // 3. Preferred role match (up to 15 pts)
  if (user.preferred_role) {
    const roleLower = user.preferred_role.toLowerCase();
    if (opp.title.toLowerCase().includes(roleLower) || oppText.includes(roleLower)) {
      score += 15;
    }
  }

  // 4. Remote / location preference (up to 10 pts)
  if (user.remote_preference && (opp.location?.toLowerCase().includes('remote') || opp.mode?.toLowerCase().includes('remote'))) {
    score += 10;
  } else if (user.location && opp.location?.toLowerCase().includes(user.location.toLowerCase())) {
    score += 10;
  }

  const finalScore = Math.min(99, Math.max(score > 0 ? 35 : 0, score));
  return { matchScore: finalScore, matchedSkills };
}

export default function App() {
  const { user, loading: authLoading } = useAuth();

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'pipeline' | 'saved' | 'scrapers'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [hasPromptedAuth, setHasPromptedAuth] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Data states
  const [opportunities, setOpportunities] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isPaidOnly, setIsPaidOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('live');
  const [sortBy, setSortBy] = useState('posted_at');

  // Category counts
  const [counts, setCounts] = useState({
    total: 0,
    liveTotal: 0,
    expiredTotal: 0,
    hackathons: 0,
    internships: 0,
    jobs: 0,
    scholarships: 0,
    liveHackathons: 0,
    liveInternships: 0,
    liveJobs: 0,
    liveScholarships: 0,
    expiredHackathons: 0,
    expiredInternships: 0,
    expiredJobs: 0,
    expiredScholarships: 0,
  });

  // Fetch opportunities
  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        domain: selectedDomain || undefined,
        location: selectedLocation || undefined,
        is_paid: isPaidOnly ? true : undefined,
        status_filter: statusFilter,
        sort_by: sortBy,
        order: sortBy === 'deadline' ? 'asc' : sortBy === 'title' ? 'asc' : 'desc',
        page: 1,
        page_size: 50,
      };
      const res = await api.getOpportunities(params);
      setOpportunities(res.items || []);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      setError('Could not connect to backend server. Please verify FastAPI is running.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedDomain, selectedLocation, isPaidOnly, statusFilter, sortBy]);

  // Fetch metrics counts
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await api.getMetrics();
      if (res && res.by_category) {
        setCounts({
          total: res.total || 0,
          liveTotal: res.live_total || 0,
          expiredTotal: res.expired_total || 0,
          hackathons: res.by_category.hackathon?.total || 0,
          internships: res.by_category.internship?.total || 0,
          jobs: res.by_category.job?.total || 0,
          scholarships: res.by_category.scholarship?.total || 0,
          liveHackathons: res.by_category.hackathon?.live || 0,
          liveInternships: res.by_category.internship?.live || 0,
          liveJobs: res.by_category.job?.live || 0,
          liveScholarships: res.by_category.scholarship?.live || 0,
          expiredHackathons: res.by_category.hackathon?.expired || 0,
          expiredInternships: res.by_category.internship?.expired || 0,
          expiredJobs: res.by_category.job?.expired || 0,
          expiredScholarships: res.by_category.scholarship?.expired || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  }, []);

  // Feedback Toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch user data (saved and applications) with localStorage fallback
  const fetchUserData = useCallback(async () => {
    if (!user) {
      try {
        const guestSaved = JSON.parse(localStorage.getItem('cot_guest_saved') || '[]');
        const guestApps = JSON.parse(localStorage.getItem('cot_guest_apps') || '[]');
        setSavedItems(guestSaved);
        setApplications(guestApps);
      } catch {
        setSavedItems([]);
        setApplications([]);
      }
      return;
    }
    try {
      const [savedRes, appsRes] = await Promise.all([
        api.getSaved().catch(() => []),
        api.getApplications().catch(() => []),
      ]);
      setSavedItems(savedRes || []);
      setApplications(appsRes || []);
    } catch (err) {
      console.error('Failed to fetch user lists:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Keyboard shortcut listener for ⌘K
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Bookmark toggle
  const handleToggleSave = async (opp) => {
    const alreadySaved = savedItems.some((s) => s.opportunity_id === opp.id);
    if (!user) {
      // Guest local storage fallback
      let updated;
      if (alreadySaved) {
        updated = savedItems.filter((s) => s.opportunity_id !== opp.id);
        showToast(`Removed "${opp.title}" from saved bookmarks.`);
      } else {
        updated = [...savedItems, { id: `guest-${opp.id}`, opportunity_id: opp.id, saved_at: new Date().toISOString() }];
        showToast(`Saved "${opp.title}" to local radar.`);
      }
      setSavedItems(updated);
      localStorage.setItem('cot_guest_saved', JSON.stringify(updated));
      return;
    }

    try {
      if (alreadySaved) {
        await api.unsaveOpportunity(opp.id);
        setSavedItems((prev) => prev.filter((s) => s.opportunity_id !== opp.id));
        showToast(`Removed "${opp.title}" from saved bookmarks.`);
      } else {
        const res = await api.saveOpportunity(opp.id);
        setSavedItems((prev) => [...prev, res]);
        showToast(`Saved "${opp.title}" to radar.`);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      showToast('Could not save opportunity.');
    }
  };

  // Applications tracker operations
  const handleSaveApplication = async (opportunityId, status, notes) => {
    const opp = opportunities.find((o) => o.id === opportunityId) || selectedOpportunity;
    if (!user) {
      // Guest local storage fallback
      const existing = applications.find((a) => a.opportunity_id === opportunityId);
      let updated;
      if (existing) {
        updated = applications.map((a) =>
          a.opportunity_id === opportunityId
            ? { ...a, status: status || a.status, notes: notes !== undefined ? notes : a.notes }
            : a
        );
      } else {
        const newApp = {
          id: `guest-app-${Date.now()}`,
          opportunity_id: opportunityId,
          status: status || 'applied',
          notes: notes || '',
          applied_at: new Date().toISOString(),
          opportunity: opp,
        };
        updated = [...applications, newApp];
      }
      setApplications(updated);
      localStorage.setItem('cot_guest_apps', JSON.stringify(updated));
      showToast(`Pipeline updated to "${status || 'applied'}".`);
      return;
    }

    const existing = applications.find((a) => a.opportunity_id === opportunityId);
    if (existing) {
      const updated = await api.updateApplication(existing.id, { status, notes });
      setApplications((prev) =>
        prev.map((a) => (a.id === existing.id ? { ...updated, opportunity: existing.opportunity } : a))
      );
      showToast(`Pipeline updated to "${status || existing.status}".`);
    } else {
      const created = await api.createApplication({
        opportunity_id: opportunityId,
        status,
        notes,
      });
      setApplications((prev) => [...prev, { ...created, opportunity: opp }]);
      showToast(`Moved to "${status}" lane.`);
    }
  };

  const handleUpdateAppStatus = async (applicationId, newStatus, notes) => {
    if (!user) {
      const updated = applications.map((a) =>
        a.id === applicationId
          ? { ...a, status: newStatus || a.status, notes: notes !== null && notes !== undefined ? notes : a.notes }
          : a
      );
      setApplications(updated);
      localStorage.setItem('cot_guest_apps', JSON.stringify(updated));
      showToast('Application stage updated.');
      return;
    }

    try {
      const payload = {};
      if (newStatus) payload.status = newStatus;
      if (notes !== null && notes !== undefined) payload.notes = notes;
      const updated = await api.updateApplication(applicationId, payload);
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, ...updated } : a))
      );
      showToast('Application stage updated.');
    } catch (err) {
      console.error('Failed to update app status:', err);
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    if (!user) {
      const updated = applications.filter((a) => a.id !== applicationId);
      setApplications(updated);
      localStorage.setItem('cot_guest_apps', JSON.stringify(updated));
      showToast('Application removed from tracking.');
      return;
    }

    try {
      await api.deleteApplication(applicationId);
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      showToast('Application removed from tracking.');
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const handleCreateManualEntry = async (manualData) => {
    const mockOpp = {
      id: `manual-${Date.now()}`,
      title: manualData.title,
      organization: manualData.organization,
      category: manualData.category,
      description: manualData.notes,
      source: 'manual',
      status: 'active',
      location: 'On-Campus / Direct',
    };

    if (!user) {
      const app = {
        id: `guest-app-${Date.now()}`,
        opportunity_id: mockOpp.id,
        status: manualData.status,
        notes: manualData.notes,
        applied_at: new Date().toISOString(),
        opportunity: mockOpp,
      };
      const updated = [...applications, app];
      setApplications(updated);
      localStorage.setItem('cot_guest_apps', JSON.stringify(updated));
      showToast(`Created manual entry for "${manualData.title}".`);
      return;
    }

    try {
      const createdOpp = await api.createOpportunity(mockOpp);
      const app = await api.createApplication({
        opportunity_id: createdOpp.id,
        status: manualData.status,
        notes: manualData.notes,
      });
      setApplications((prev) => [...prev, { ...app, opportunity: createdOpp }]);
      fetchOpportunities();
      showToast(`Created manual entry for "${manualData.title}".`);
    } catch (err) {
      console.error('Failed to create manual entry:', err);
    }
  };

  const handleDeleteOpportunity = async (oppId) => {
    try {
      await api.deleteOpportunity(oppId);
      setOpportunities((prev) => prev.filter((o) => o.id !== oppId));
      setSavedItems((prev) => prev.filter((s) => s.opportunity_id !== oppId));
      setApplications((prev) => prev.filter((a) => a.opportunity_id !== oppId));
      fetchMetrics();
    } catch (err) {
      console.error('Failed to delete opportunity:', err);
      throw err;
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedDomain('');
    setSelectedLocation('');
    setIsPaidOnly(false);
    setStatusFilter('live');
    setSortBy('posted_at');
  };

  const handleSyncCompleted = () => {
    fetchOpportunities();
    fetchMetrics();
    fetchUserData();
  };

  // Map of saved opportunity IDs
  const savedOppIds = new Set(savedItems.map((s) => s.opportunity_id));

  // Map of application statuses by opportunity ID
  const appStatusMap = {};
  applications.forEach((a) => {
    appStatusMap[a.opportunity_id] = a.status;
  });

  // Calculate matches
  const opportunitiesWithMatch = opportunities.map((opp) => {
    const match = computeMatch(opp, user);
    return { ...opp, ...match };
  });

  // Prime match candidate (highest score)
  const primeMatchOpportunity =
    opportunitiesWithMatch.length > 0
      ? [...opportunitiesWithMatch].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))[0]
      : null;

  // Urgent opportunities count (<48 hours)
  const urgentCount = opportunities.filter((o) => {
    if (!o.deadline) return false;
    const diff = (new Date(o.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return diff > 0 && diff <= 48;
  }).length;

  const matchCount = opportunitiesWithMatch.filter((o) => (o.matchScore || 0) >= 40).length || 8;

  // Saved list of full opportunity objects
  const savedOpportunitiesList = opportunitiesWithMatch.filter((o) =>
    savedOppIds.has(o.id)
  );

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col selection:bg-secondary/20 selection:text-secondary w-full max-w-full overflow-x-hidden">
      {/* Sticky Top Cockpit Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        savedCount={savedItems.length}
        applicationsCount={applications.length}
        onOpenEmailModal={() => setEmailModalOpen(true)}
        onOpenAdminModal={() => setAdminModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        urgentCount={urgentCount}
        matchCount={matchCount}
      />

      {/* Left Telemetry Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedCount={savedItems.length}
        applicationsCount={applications.length}
        onOpenAdmin={() => setAdminModalOpen(true)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (offset by 64px left on lg) */}
      <div className="lg:pl-64 pt-16 flex-1 flex flex-col w-full max-w-full min-w-0 overflow-x-hidden">
        {/* T-Minus Urgency Feed Ticker */}
        <UrgencyTicker
          opportunities={opportunities}
          onSelectOpportunity={setSelectedOpportunity}
          onSyncCompleted={handleSyncCompleted}
        />

        <main className="w-full max-w-full min-w-0 p-3 sm:p-5 lg:p-8 flex-1 flex flex-col gap-4 sm:gap-6 relative overflow-hidden">
          {/* Ambient Radial Atmosphere Glows */}
          <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-36 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10 max-w-full"></div>
          <div className="absolute top-20 right-1/4 w-60 sm:w-80 h-44 bg-primary-container/5 rounded-full blur-3xl pointer-events-none -z-10 max-w-full"></div>

          {/* Student Welcome & Poornima Personalization Ribbon */}
          {user && (
            <div className="p-4 rounded-xl bg-surface-container-low border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-container/15 text-secondary border border-secondary/30 flex items-center justify-center font-bold font-mono">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'PO'}
                </div>
                <div>
                  <h2 className="font-headline-md text-body-md font-bold text-on-surface">
                    Welcome back, {user.name}!
                  </h2>
                  <p className="font-mono-micro text-mono-micro text-on-surface-variant">
                    Specializing in <span className="text-secondary font-semibold">{user.domain || 'Software Development'}</span> • Skills: {(user.skills || []).join(', ') || 'None set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProfileModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-hairline transition text-body-sm font-medium"
                >
                  Edit Profile & Skills
                </button>
                {user.domain && selectedDomain !== user.domain && (
                  <button
                    onClick={() => setSelectedDomain(user.domain)}
                    className="px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary font-bold text-body-sm hover:brightness-110 transition shadow-glow-secondary"
                  >
                    Match My Domain
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW 1: Radar & Opportunity Bento Feed */}
          {activeTab === 'radar' && (
            <div className="space-y-6">
              {/* Prime Match Bento Hero */}
              {primeMatchOpportunity && (
                <PrimeMatchHero
                  opportunity={primeMatchOpportunity}
                  onSelect={setSelectedOpportunity}
                  isSaved={savedOppIds.has(primeMatchOpportunity.id)}
                  onToggleSave={handleToggleSave}
                  applicationStatus={appStatusMap[primeMatchOpportunity.id]}
                  onUpdateStatus={handleSaveApplication}
                />
              )}

              {/* Category Counts Overview */}
              <MetricsOverview
                counts={counts}
                activeCategory={selectedCategory}
                onSelectCategory={(catId) => setSelectedCategory(catId || '')}
                statusFilter={statusFilter}
              />

              {/* Search & Filters Bar */}
              <FiltersBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedDomain={selectedDomain}
                setSelectedDomain={setSelectedDomain}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                isPaidOnly={isPaidOnly}
                setIsPaidOnly={setIsPaidOnly}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onResetFilters={handleResetFilters}
              />

              {/* Grid: Bento Opportunity Cards + Upcoming Deadlines Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* 3-Col Opportunity Bento Cards Grid */}
                <div className="lg:col-span-3 space-y-4">
                  {error && (
                    <div className="p-4 rounded-xl bg-error-container/20 border border-error/40 text-error text-body-sm flex items-center justify-between">
                      <span>{error}</span>
                      <button
                        onClick={fetchOpportunities}
                        className="px-3 py-1 bg-error-container text-on-error rounded-lg font-bold"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="bg-surface-container-low border border-hairline rounded-xl p-5 h-52 animate-pulse flex flex-col justify-between"
                        >
                          <div className="h-4 bg-surface-container-high rounded w-1/3" />
                          <div className="h-6 bg-surface-container-high rounded w-3/4" />
                          <div className="h-4 bg-surface-container-high rounded w-1/2" />
                          <div className="h-4 bg-surface-container-high rounded w-full" />
                        </div>
                      ))}
                    </div>
                  ) : opportunitiesWithMatch.length === 0 ? (
                    <div className="p-12 rounded-xl bg-surface-container-low border border-hairline text-center space-y-3">
                      <span className="material-symbols-outlined text-[40px] text-outline">
                        radar
                      </span>
                      <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                        No Opportunities Matched Filters
                      </h3>
                      <p className="font-mono-micro text-mono-micro text-on-surface-variant max-w-md mx-auto">
                        Try clearing active category or domain filters, or click below to trigger a live multi-source web and email crawl.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-bold text-body-sm shadow-glow-primary"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {opportunitiesWithMatch.map((opp) => (
                        <OpportunityCard
                          key={opp.id}
                          opportunity={opp}
                          isSaved={savedOppIds.has(opp.id)}
                          onToggleSave={handleToggleSave}
                          onSelect={setSelectedOpportunity}
                          applicationStatus={appStatusMap[opp.id]}
                          onUpdateStatus={handleSaveApplication}
                          matchScore={opp.matchScore}
                          matchedSkills={opp.matchedSkills}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Deadlines Radar */}
                <div className="lg:col-span-1 space-y-4">
                  <DeadlineSidebar
                    opportunities={opportunities}
                    onSelectOpportunity={setSelectedOpportunity}
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: Active Pipeline Kanban Board */}
          {activeTab === 'pipeline' && (
            <ApplicationTracker
              applications={applications}
              onUpdateStatus={handleUpdateAppStatus}
              onDeleteApplication={handleDeleteApplication}
              onSelectOpportunity={setSelectedOpportunity}
              onCreateManualEntry={handleCreateManualEntry}
            />
          )}

          {/* VIEW 3: Saved Opportunities View */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-hairline">
                <div>
                  <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[24px] text-secondary">
                      bookmark
                    </span>
                    Saved Opportunities
                  </h1>
                  <p className="font-mono-micro text-mono-micro text-outline mt-0.5">
                    Your personal radar shortlist of saved postings and hackathons
                  </p>
                </div>
                <span className="font-mono-micro text-mono-micro px-2 py-0.5 rounded bg-surface-container-high text-secondary">
                  {savedOpportunitiesList.length} Items Saved
                </span>
              </div>

              {savedOpportunitiesList.length === 0 ? (
                <div className="p-16 rounded-xl bg-surface-container-low border border-hairline text-center space-y-3">
                  <span className="material-symbols-outlined text-[40px] text-outline">
                    bookmark_border
                  </span>
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                    No Opportunities Shortlisted
                  </h3>
                  <p className="font-mono-micro text-mono-micro text-on-surface-variant max-w-sm mx-auto">
                    Click the bookmark icon on any opportunity card in the Stream to save it here for quick access.
                  </p>
                  <button
                    onClick={() => setActiveTab('radar')}
                    className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-bold text-body-sm shadow-glow-primary"
                  >
                    Browse Opportunity Stream
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedOpportunitiesList.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      isSaved={true}
                      onToggleSave={handleToggleSave}
                      onSelect={setSelectedOpportunity}
                      applicationStatus={appStatusMap[opp.id]}
                      onUpdateStatus={handleSaveApplication}
                      matchScore={opp.matchScore}
                      matchedSkills={opp.matchedSkills}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: Scraper Health & Crawler Topology View */}
          {activeTab === 'scrapers' && (
            <CrawlerTopologyView onSyncCompleted={handleSyncCompleted} />
          )}
        </main>
      </div>

      {/* Global Command Palette Modal (⌘K) */}
      <CommandPaletteModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        opportunities={opportunitiesWithMatch}
        onSelectOpportunity={setSelectedOpportunity}
      />

      {/* Opportunity Detail Drawer / Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          isSaved={savedOppIds.has(selectedOpportunity.id)}
          onToggleSave={handleToggleSave}
          application={applications.find((a) => a.opportunity_id === selectedOpportunity.id)}
          onSaveApplication={handleSaveApplication}
          user={user}
          onDeleteOpportunity={handleDeleteOpportunity}
          matchScore={selectedOpportunity.matchScore}
          matchedSkills={selectedOpportunity.matchedSkills}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Email Sync Modal */}
      <EmailSyncModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSyncComplete={handleSyncCompleted}
      />

      {/* Admin Sources Modal */}
      <AdminSourcesModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-container-high border border-hairline text-on-surface shadow-2xl backdrop-blur-md">
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              check_circle
            </span>
            <span className="font-body-sm text-body-sm font-medium">
              {toastMessage}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
