import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import MetricsOverview from './components/MetricsOverview';
import FiltersBar from './components/FiltersBar';
import OpportunityCard from './components/OpportunityCard';
import OpportunityDetailModal from './components/OpportunityDetailModal';
import DeadlineSidebar from './components/DeadlineSidebar';
import ApplicationTracker from './components/ApplicationTracker';
import AuthModal from './components/AuthModal';
import ScraperSyncBar from './components/ScraperSyncBar';
import EmailSyncModal from './components/EmailSyncModal';
import AdminSourcesModal from './components/AdminSourcesModal';
import ProfileModal from './components/ProfileModal';
import { api } from './api/client';
import { useAuth } from './context/AuthContext';
import { Sparkles, Inbox, RefreshCw, Bookmark } from 'lucide-react';

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

  // Navigation & modals
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'recommended' | 'saved' | 'applications'
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

  // Fetch metrics counts from dedicated endpoint
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

  // Fetch user data (saved and applications)
  const fetchUserData = useCallback(async () => {
    if (!user) {
      setSavedItems([]);
      setApplications([]);
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

  // Prompt login window automatically when user hits the page if unauthenticated
  useEffect(() => {
    if (!authLoading && !user && !hasPromptedAuth) {
      setAuthModalOpen(true);
      setHasPromptedAuth(true);
    }
  }, [authLoading, user, hasPromptedAuth]);

  // Bookmark toggle
  const handleToggleSave = async (opp) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const alreadySaved = savedItems.some((s) => s.opportunity_id === opp.id);
    try {
      if (alreadySaved) {
        await api.unsaveOpportunity(opp.id);
        setSavedItems((prev) => prev.filter((s) => s.opportunity_id !== opp.id));
      } else {
        const res = await api.saveOpportunity(opp.id);
        setSavedItems((prev) => [...prev, res]);
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  // Applications tracker operations
  const handleSaveApplication = async (opportunityId, status, notes) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const existing = applications.find((a) => a.opportunity_id === opportunityId);
    if (existing) {
      const updated = await api.updateApplication(existing.id, { status, notes });
      setApplications((prev) =>
        prev.map((a) => (a.id === existing.id ? { ...updated, opportunity: existing.opportunity } : a))
      );
    } else {
      const created = await api.createApplication({
        opportunity_id: opportunityId,
        status,
        notes,
      });
      // Find the opportunity object
      const opp = opportunities.find((o) => o.id === opportunityId) || selectedOpportunity;
      setApplications((prev) => [...prev, { ...created, opportunity: opp }]);
    }
  };

  const handleUpdateAppStatus = async (applicationId, newStatus, notes) => {
    try {
      const payload = {};
      if (newStatus) payload.status = newStatus;
      if (notes !== null && notes !== undefined) payload.notes = notes;
      const updated = await api.updateApplication(applicationId, payload);
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, ...updated } : a))
      );
    } catch (err) {
      console.error('Failed to update app status:', err);
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    try {
      await api.deleteApplication(applicationId);
      setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    } catch (err) {
      console.error('Failed to delete application:', err);
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
  };

  // Map of saved opportunity IDs for fast lookup
  const savedOppIds = new Set(savedItems.map((s) => s.opportunity_id));

  // Map of application statuses by opportunity ID
  const appStatusMap = {};
  applications.forEach((a) => {
    appStatusMap[a.opportunity_id] = a.status;
  });

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

  const opportunitiesWithMatch = opportunities.map((opp) => {
    const match = computeMatch(opp, user);
    return { ...opp, ...match };
  });

  const recommendedList = opportunitiesWithMatch
    .filter((opp) => (opp.matchScore || 0) > 0)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const handleSelectOpportunityId = async (oppId) => {
    try {
      const opp = await api.getOpportunity(oppId);
      if (opp) {
        const match = computeMatch(opp, user);
        setSelectedOpportunity({ ...opp, ...match });
      }
    } catch (err) {
      console.error('Failed to load opportunity:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        savedCount={savedItems.length}
        applicationsCount={applications.length}
        onOpenEmailModal={() => setEmailModalOpen(true)}
        onOpenAdminModal={() => setAdminModalOpen(true)}
        onSelectOpportunityId={handleSelectOpportunityId}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner with Poornima personalization badge */}
        {user && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-700 text-white shadow-md shadow-brand-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Welcome back, {user.name}!</h2>
                <p className="text-xs text-brand-100">
                  Targeting {user.domain || 'Software Development'} • Skills: {(user.skills || []).join(', ') || 'No skills set yet'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setProfileModalOpen(true)}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg transition"
              >
                Edit Profile & Skills
              </button>
              {user.domain && selectedDomain !== user.domain && (
                <button
                  onClick={() => setSelectedDomain(user.domain)}
                  className="px-3 py-1.5 bg-white text-brand-700 text-xs font-bold rounded-lg hover:bg-brand-50 transition shadow-sm"
                >
                  Match My Domain
                </button>
              )}
            </div>
          </div>
        )}


        {/* 24-Hour Scraper Auto-Timer & Instant Refresh Bar */}
        <div className="mb-6">
          <ScraperSyncBar onSyncCompleted={handleSyncCompleted} />
        </div>

        {/* Tab 1: Explore View */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            {/* Metric Category Cards */}
            <MetricsOverview
              counts={counts}
              activeCategory={selectedCategory}
              onSelectCategory={(catId) => setSelectedCategory(catId || '')}
              statusFilter={statusFilter}
            />

            {/* Filters Bar */}
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

            {/* Feed Layout: Grid of Cards + Upcoming Deadlines Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Opportunities Grid (3 columns on lg) */}
              <div className="lg:col-span-3 space-y-4">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button
                      onClick={fetchOpportunities}
                      className="px-2.5 py-1 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700"
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
                        className="bg-white rounded-2xl border border-slate-200 p-5 h-56 animate-pulse"
                      >
                        <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
                        <div className="h-6 bg-slate-100 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-slate-100 rounded w-1/2 mb-6" />
                        <div className="h-4 bg-slate-100 rounded w-full mb-2" />
                        <div className="h-4 bg-slate-100 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : opportunities.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-900">No matching opportunities</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Try clearing filters or adjusting your search keywords to view other open campus opportunities.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
                    >
                      Clear All Filters
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
                        onSelect={(item) => setSelectedOpportunity(item)}
                        applicationStatus={appStatusMap[opp.id]}
                        onUpdateStatus={(newStatus) => handleSaveApplication(opp.id, newStatus, '')}
                        matchScore={opp.matchScore}
                        matchedSkills={opp.matchedSkills}
                      />
                    ))}
                  </div>

                )}
              </div>

              {/* Sidebar: Upcoming Deadlines */}
              <div className="lg:col-span-1 space-y-4">
                <DeadlineSidebar
                  opportunities={opportunities}
                  onSelectOpportunity={(item) => setSelectedOpportunity(item)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Personalized Recommended for You (PRD §FR-1.3 & §FR-6.1) */}
        {activeTab === 'recommended' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  <span>Curated For Your Profile</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Opportunities prioritized by domain relevance and declared technical skills
                </p>
              </div>
              {user && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition"
                  >
                    Configure Skills
                  </button>
                  <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                    {recommendedList.length} Matches Found
                  </span>
                </div>
              )}
            </div>

            {!user ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Sparkles className="w-10 h-10 text-brand-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Sign in to unlock personalized recommendations</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Log in with your college student account to receive automated match scoring on hackathons, jobs, and placement drives.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
                >
                  Sign In
                </button>
              </div>
            ) : recommendedList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Add technical skills to your profile</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  We match opportunities against your declared skills and domain. Add skills like Python, React, Docker, or AI to get ranked results.
                </p>
                <button
                  onClick={() => setProfileModalOpen(true)}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
                >
                  Edit Profile & Skills
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedList.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    isSaved={savedOppIds.has(opp.id)}
                    onToggleSave={handleToggleSave}
                    onSelect={(item) => setSelectedOpportunity(item)}
                    applicationStatus={appStatusMap[opp.id]}
                    onUpdateStatus={(newStatus) => handleSaveApplication(opp.id, newStatus, '')}
                    matchScore={opp.matchScore}
                    matchedSkills={opp.matchedSkills}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved Opportunities View */}
        {activeTab === 'saved' && (

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Bookmark className="w-5 h-5 text-brand-600" />
                  <span>Saved Opportunities</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Opportunities you have bookmarked for later review
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                {savedItems.length} Bookmarked
              </span>
            </div>

            {!user ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Sign in to view saved items</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Create a student account or log in to bookmark hackathons and jobs.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
                >
                  Sign In
                </button>
              </div>
            ) : savedItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No saved opportunities yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Click the bookmark icon on any opportunity card to save it to your personal list.
                </p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700"
                >
                  Explore Opportunities
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedItems.map((item) => {
                  const opp = item.opportunity;
                  if (!opp) return null;
                  const match = computeMatch(opp, user);
                  return (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      isSaved={true}
                      onToggleSave={handleToggleSave}
                      onSelect={(oppItem) => setSelectedOpportunity({ ...oppItem, ...match })}
                      applicationStatus={appStatusMap[opp.id]}
                      onUpdateStatus={(newStatus) => handleSaveApplication(opp.id, newStatus, '')}
                      matchScore={match.matchScore}
                      matchedSkills={match.matchedSkills}
                    />
                  );
                })}
              </div>

            )}
          </div>
        )}

        {/* Tab 3: Applications Pipeline View */}
        {activeTab === 'applications' && (
          <div>
            {!user ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <h3 className="text-base font-bold text-slate-900">Sign in to track applications</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Keep track of all your applied roles, interviews, and offers in one organized dashboard.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <ApplicationTracker
                applications={applications}
                onUpdateStatus={handleUpdateAppStatus}
                onDeleteApplication={handleDeleteApplication}
                onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
              />
            )}
          </div>
        )}
      </main>

      {/* Opportunity Details Modal */}
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

      {/* Authentication Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Student Profile & Technical Skills Modal (PRD §FR-1.2) */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Campus Email Mailbox Modal */}
      <EmailSyncModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSyncComplete={handleSyncCompleted}
      />

      {/* Admin Scraper Sources Modal */}
      <AdminSourcesModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </div>

  );
}
