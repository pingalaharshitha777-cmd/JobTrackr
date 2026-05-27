import React, { useEffect, useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  BarChart2, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  LogOut,
  ChevronRight,
  Clock,
  Mail,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Download,
  Trash2,
  Edit3,
  Paperclip,
  Trash,
  User as UserIcon,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isAfter, parseISO, differenceInDays, addDays } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { User, AppState, Application, ActivityLog, ApplicationStatus, ActivityType, ReminderRule, ResumeVersion, CoverLetter, RecruiterContact, ApplicationMilestones } from './types';
import { cn } from './lib/utils';

// --- Prototype Data Helpers ---

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const downloadBase64File = (base64Data: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const computeStatusFromMilestones = (milestones: ApplicationMilestones): ApplicationStatus => {
  if (milestones.rejected) return ApplicationStatus.Rejected;
  if (milestones.offerReceived) return ApplicationStatus.Offer;
  if (milestones.interviewScheduled) return ApplicationStatus.InterviewScheduled;
  if (milestones.responseReceived) return ApplicationStatus.ResponseReceived;
  if (milestones.recruiterEmailed) return ApplicationStatus.RecruiterEmailed;
  return ApplicationStatus.Applied;
};

const DEFAULT_REMINDER_RULES: ReminderRule[] = [
  { id: '1', name: 'Standard Follow-up', daysNoResponse: 7, enabled: true }
];

const SEED_RESUMES: ResumeVersion[] = [];
const SEED_COVER_LETTERS: CoverLetter[] = [];

const INITIAL_APP_STATE: AppState = {
  applications: [],
  resumes: SEED_RESUMES,
  coverLetters: SEED_COVER_LETTERS,
  activityLogs: [],
  reminderRules: DEFAULT_REMINDER_RULES,
};

const SEED_USER = {
  id: 'seed-user-001',
  email: 'user@jobtrackr.com',
  password: 'Password123!',
  name: 'Test User',
  tier: 'Pro' as const
};

const STATUS_LABELS: Record<string, string> = {
  [ApplicationStatus.Applied]: "Only Applied",
  [ApplicationStatus.RecruiterEmailed]: "Recruiter Emailed",
  [ApplicationStatus.ResponseReceived]: "Response Received",
  [ApplicationStatus.InterviewScheduled]: "Interview Scheduled",
  [ApplicationStatus.Rejected]: "Rejected",
  [ApplicationStatus.Offer]: "Offer"
};

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, onSignOut, user }: { activeTab: string, setActiveTab: (t: string) => void, onSignOut: () => void, user: User }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'applications', icon: Briefcase, label: 'Applications' },
    { id: 'resumes', icon: FileText, label: 'Resumes' },
    { id: 'coverLetters', icon: Paperclip, label: 'Cover Letters' },
    { id: 'stats', icon: BarChart2, label: 'Stats' },
    { id: 'pricing', icon: TrendingUp, label: 'Pricing' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-[220px] bg-[#0b1121] border-r border-[#334155] flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="px-6 py-8">
        <div className="flex items-center gap-2 text-[#3b82f6] font-bold text-xl tracking-tight">
          <TrendingUp className="w-6 h-6" />
          <span>JobTrackr</span>
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col pt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "sidebar-nav-item",
              activeTab === item.id && "active"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#334155]">
        <button 
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-6 py-3 text-[#64748b] hover:text-[#ef4444] text-sm transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

const Header = ({ title, searchQuery, setSearchQuery, onAdd, user, onSignOut }: { title: string, searchQuery: string, setSearchQuery: (q: string) => void, onAdd: () => void, user: any, onSignOut: () => void }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-[72px] border-b border-[#334155] flex items-center justify-between px-8 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-40">
      <h1 className="text-xl font-bold text-[#f8fafc]">{title}</h1>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search applications..." 
            className="bg-[#1e293b] border border-[#334155] rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] w-80 text-[#f8fafc] placeholder:text-[#64748b]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
        </div>

        <button 
          onClick={onAdd}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden lg:inline">Add Application</span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-6 border-l border-[#334155] group"
          >
            <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6] text-xs font-bold group-hover:border-[#3b82f6]/60 transition-all">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-[#f8fafc]">{user.name}</div>
              <div className="text-[10px] text-[#64748b]">{user.tier || 'Free'} Account</div>
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[#334155]">
                    <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">User Profile</div>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-[#f8fafc] hover:bg-[#334155] flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button 
                    onClick={() => { setShowProfileMenu(false); onSignOut(); }}
                    className="w-full text-left px-4 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};


const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'urgent' | 'success' | 'warn' }) => {
  const styles = {
    default: 'badge-status',
    urgent: 'badge-due',
    success: 'bg-[rgba(16,185,129,0.1)] text-[#10b981] border-[rgba(16,185,129,0.2)]',
    warn: 'badge-due',
  };
  return (
    <span className={cn("badge", styles[variant])}>
      {children}
    </span>
  );
};

// --- Main Screens ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmAppId, setDeleteConfirmAppId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('jobtrackr_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('jobtrackr_users');
    const users = saved ? JSON.parse(saved) : [SEED_USER];
    if (!saved) localStorage.setItem('jobtrackr_users', JSON.stringify(users));
    return users;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (email: string, pass: string) => {
    const found = registeredUsers.find(u => u.email === email && u.password === pass);
    if (found) {
      const { password, ...userSession } = found;
      setCurrentUser(userSession as User);
      localStorage.setItem('jobtrackr_session', JSON.stringify(userSession));
      setAuthError(null);
      showToast(`Welcome back, ${userSession.name}!`);
    } else {
      setAuthError('Invalid email or password');
    }
  };

  const handleSignUp = (name: string, email: string, pass: string) => {
    if (registeredUsers.find(u => u.email === email)) {
      setAuthError('Email already exists');
      return;
    }
    const newUser: User = { id: crypto.randomUUID(), name, email, password: pass, tier: 'Free' };
    const updatedUsers = [...registeredUsers, newUser];
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('jobtrackr_users', JSON.stringify(updatedUsers));
    
    const { password, ...userSession } = newUser;
    setCurrentUser(userSession as User);
    localStorage.setItem('jobtrackr_session', JSON.stringify(userSession));
    showToast('Account created successfully!');
  };

  const handleResetPassword = (email: string, newPass: string) => {
    const userIndex = registeredUsers.findIndex(u => u.email === email);
    if (userIndex === -1) return;
    
    const updatedUsers = [...registeredUsers];
    updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPass };
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('jobtrackr_users', JSON.stringify(updatedUsers));
    showToast('Password updated successfully');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('jobtrackr_session');
    setActiveTab('dashboard');
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast("Copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const refreshData = () => {
    if (!currentUser) return;
    const storageKey = `jobtrackr_data_${currentUser.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setState(JSON.parse(saved));
    } else {
      localStorage.setItem(storageKey, JSON.stringify(INITIAL_APP_STATE));
      setState(INITIAL_APP_STATE);
    }
    setLoading(false);
  };

  const persistData = (newState: AppState) => {
    if (!currentUser) return;
    setState(newState);
    localStorage.setItem(`jobtrackr_data_${currentUser.id}`, JSON.stringify(newState));
  };

  // Derived Selectors
  const filteredApplications = useMemo(() => {
    if (!state) return [];
    if (!searchQuery.trim()) return state.applications;
    
    const query = searchQuery.toLowerCase();
    return state.applications.filter(app => 
      app.company.toLowerCase().includes(query) ||
      app.role.toLowerCase().includes(query) ||
      app.jobId?.toLowerCase().includes(query) ||
      app.recruiterName?.toLowerCase().includes(query) ||
      app.recruiterEmail?.toLowerCase().includes(query) ||
      app.notes.toLowerCase().includes(query)
    );
  }, [state?.applications, searchQuery]);

  const dueFollowUps = useMemo(() => {
    if (!state) return [];
    const today = new Date();
    // Use the canonical applications list
    return state.applications.filter(app => {
      const isStatusValid = [ApplicationStatus.Applied, ApplicationStatus.RecruiterEmailed].includes(app.status);
      const isDue = isAfter(today, parseISO(app.nextFollowUpAt)) || differenceInDays(today, parseISO(app.nextFollowUpAt)) === 0;
      return isStatusValid && isDue;
    });
  }, [state?.applications]);
  
  // Dashboard-specific stats (responses, interviews, etc)
  const dashboardStats = useMemo(() => {
    if (!state) return [];
    const apps = state.applications;
    const responses = apps.filter((a: any) => 
      [ApplicationStatus.ResponseReceived, ApplicationStatus.InterviewScheduled, ApplicationStatus.Offer, ApplicationStatus.Rejected].includes(a.status)
    ).length;

    return [
      { label: 'Total Applications', value: apps.length },
      { label: 'Responses', value: responses },
      { label: 'Interviews', value: apps.filter((a: any) => a.status === ApplicationStatus.InterviewScheduled).length },
      { label: 'Offers', value: apps.filter((a: any) => a.status === ApplicationStatus.Offer).length },
    ];
  }, [state?.applications]);

  const allStats = useMemo(() => {
    if (!state) return null;
    const apps = state.applications;
    const statusCounts = apps.reduce((acc: any, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ 
      name: STATUS_LABELS[name as string] || name, 
      value 
    }));
    const colors = ['#3B82F6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

    const kpis = [
      { label: 'Total Applications', value: apps.length, icon: Briefcase, color: 'text-[#3b82f6]' },
      { label: 'Interviews Scheduled', value: apps.filter(a => a.status === ApplicationStatus.InterviewScheduled).length, icon: Calendar, color: 'text-[#10b981]' },
      { label: 'Offers', value: apps.filter(a => a.status === ApplicationStatus.Offer).length, icon: CheckCircle2, color: 'text-[#8b5cf6]' },
      { label: 'Total Nudges', value: dueFollowUps.length, icon: Bell, color: 'text-[#f59e0b]' },
    ];

    return { kpis, pieData, colors };
  }, [state?.applications, dueFollowUps]);

  const handleAddApp = (data: any) => {
    if (!state || !currentUser) return;

    // Tier enforcement
    const activeApps = state.applications.filter(a => a.status !== ApplicationStatus.Rejected).length;
    if (currentUser.tier === 'Free' && activeApps >= 25) {
      alert('Free plan supports up to 25 active applications. Please upgrade to Pro for unlimited tracking.');
      setActiveTab('pricing');
      setIsAddModalOpen(false);
      return;
    }

    const { recruiterContacts, resumeVersionId, coverLetterId, ...appData } = data;
    const appId = crypto.randomUUID();
    
    // Find labels
    const resume = state.resumes.find(r => r.id === resumeVersionId);
    const coverLetter = state.coverLetters.find(c => c.id === coverLetterId);
    
    const newContacts = (recruiterContacts || []).map((c: any) => ({
      ...c,
      id: crypto.randomUUID(),
      applicationId: appId,
      createdAt: new Date().toISOString()
    }));

    const newApp: Application = {
      id: appId,
      ...appData,
      resumeVersionId,
      resumeLabel: resume?.label || 'Unknown',
      coverLetterId,
      coverLetterLabel: coverLetter?.label,
      status: ApplicationStatus.Applied,
      lastTouchpointAt: new Date().toISOString(),
      nextFollowUpAt: addDays(new Date(), state.reminderRules[0].daysNoResponse).toISOString(),
      milestones: {
        recruiterEmailed: false,
        responseReceived: false,
        interviewScheduled: false,
        offerReceived: false,
        rejected: false
      },
      recruiterContacts: newContacts
    };

    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      applicationId: appId,
      type: ActivityType.Applied,
      summary: `Application created for ${appData.role} at ${appData.company}`,
      occurredAt: new Date().toISOString()
    };

    persistData({
      ...state,
      applications: [newApp, ...state.applications],
      activityLogs: [newLog, ...state.activityLogs]
    });
    setIsAddModalOpen(false);
    showToast('Application added!');
  };

  const handleUpdateResumes = (resumes: ResumeVersion[]) => {
    if (!state) return;
    persistData({ ...state, resumes });
  };

  const handleUpdateCoverLetters = (coverLetters: CoverLetter[]) => {
    if (!state) return;
    persistData({ ...state, coverLetters });
  };

  const handleUpdateStatus = (appId: string, status: ApplicationStatus) => {
    if (!state) return;
    const app = state.applications.find(a => a.id === appId);
    if (!app) return;

    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      applicationId: appId,
      type: status as unknown as ActivityType,
      summary: `Status changed to ${status}`,
      occurredAt: new Date().toISOString()
    };

    const updatedApps = state.applications.map(app => 
      app.id === appId ? { ...app, status, lastTouchpointAt: new Date().toISOString() } : app
    );
    persistData({ 
      ...state, 
      applications: updatedApps,
      activityLogs: [newLog, ...state.activityLogs]
    });
  };

  const handleDeleteApp = (appId: string) => {
    if (!state) return;
    const app = state.applications.find(a => a.id === appId);
    if (!app) {
      showToast('Could not delete: application not found');
      return;
    }
    setDeleteConfirmAppId(appId);
  };

  const executeDeleteApp = (appId: string) => {
    if (!state) return;
    const app = state.applications.find(a => a.id === appId);
    if (!app) {
      showToast('Could not delete: application not found');
      return;
    }

    persistData({
      ...state,
      applications: state.applications.filter(a => a.id !== appId),
      activityLogs: state.activityLogs.filter(l => l.applicationId !== appId)
    });
    
    if (selectedAppId === appId) setSelectedAppId(null);
    if (activeTab === 'detail') setActiveTab('applications');
    showToast('Application deleted');
  };

  const handleLogActivity = (appId: string, activity: any) => {
    if (!state) return;
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      applicationId: appId,
      ...activity
    };
    
    // Auto-update status based on activity type if needed
    let statusUpdate = {};
    if (activity.type === ActivityType.Rejected) statusUpdate = { status: ApplicationStatus.Rejected };
    if (activity.type === ActivityType.Offer) statusUpdate = { status: ApplicationStatus.Offer };
    if (activity.type === ActivityType.InterviewScheduled) statusUpdate = { status: ApplicationStatus.InterviewScheduled };

    const updatedApps = state.applications.map(app => 
      app.id === appId ? { ...app, ...statusUpdate, lastTouchpointAt: new Date().toISOString() } : app
    );

    persistData({
      ...state,
      applications: updatedApps,
      activityLogs: [newLog, ...state.activityLogs]
    });
    setIsLogModalOpen(false);
    showToast('Activity logged');
  };

  const handleMarkFollowUp = (appId: string) => {
    if (!state) return;
    const followUpDate = addDays(new Date(), state.reminderRules[0].daysNoResponse).toISOString();
    
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      applicationId: appId,
      type: ActivityType.FollowUpSent,
      summary: 'Follow-up sent manually',
      occurredAt: new Date().toISOString()
    };

    const updatedApps = state.applications.map(app => 
      app.id === appId ? { 
        ...app, 
        lastTouchpointAt: new Date().toISOString(),
        nextFollowUpAt: followUpDate
      } : app
    );

    persistData({
      ...state,
      applications: updatedApps,
      activityLogs: [newLog, ...state.activityLogs]
    });
    showToast('Follow-up recorded');
  };

  const handleUpdateReminder = (days: number, enabled: boolean) => {
    if (!state) return;
    const updatedRules = state.reminderRules.map(r => 
      r.id === '1' ? { ...r, daysNoResponse: days, enabled } : r
    );
    persistData({ ...state, reminderRules: updatedRules });
    showToast('Reminder rules updated');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthFlow onLogin={handleLogin} onSignUp={handleSignUp} onResetPassword={handleResetPassword} users={registeredUsers} error={authError} />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={handleSignOut} user={currentUser} />
      
      <main className="flex-1 ml-[220px] overflow-hidden flex flex-col h-screen">
        <Header 
          title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAdd={() => setIsAddModalOpen(true)} 
          user={currentUser}
          onSignOut={handleSignOut}
        />
        
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#3b82f6] text-white px-6 py-3 rounded-full shadow-2xl z-[200] font-bold text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {toast}
          </motion.div>
        )}
        
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardScreen 
                applications={filteredApplications}
                dueFollowUps={dueFollowUps}
                stats={dashboardStats}
                onUpdateStatus={handleUpdateStatus}
                onLogActivity={(id: string) => { setSelectedAppId(id); setIsLogModalOpen(true); }}
                onMarkFollowUp={handleMarkFollowUp}
                onViewDetail={(id: string) => { setSelectedAppId(id); setActiveTab('detail'); }}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                copyToClipboard={copyToClipboard}
                state={state!}
              />
            )}
            {activeTab === 'applications' && (
              <ApplicationsTable 
                applications={filteredApplications}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onLogActivity={(id: string) => { setSelectedAppId(id); setIsLogModalOpen(true); }}
                onViewDetail={(id: string) => { setSelectedAppId(id); setActiveTab('detail'); }}
                onDelete={handleDeleteApp}
                onMarkFollowUp={handleMarkFollowUp}
                copyToClipboard={copyToClipboard}
                state={state!}
              />
            )}
            {activeTab === 'stats' && (
              <StatsScreen state={state!} allStats={allStats} onAddApp={() => setIsAddModalOpen(true)} />
            )}
            {activeTab === 'resumes' && (
              <ResumeLibraryScreen 
                resumes={state?.resumes || []}
                onUpdate={handleUpdateResumes}
                showToast={showToast}
              />
            )}
            {activeTab === 'coverLetters' && (
              <CoverLetterLibraryScreen 
                coverLetters={state?.coverLetters || []}
                onUpdate={handleUpdateCoverLetters}
                showToast={showToast}
              />
            )}
            {activeTab === 'pricing' && (
              <PricingScreen 
                user={currentUser} 
                onUpdateTier={(tier) => {
                  const updatedUser = { ...currentUser, tier };
                  setCurrentUser(updatedUser);
                  localStorage.setItem('jobtrackr_session', JSON.stringify(updatedUser));
                  
                  // Also update in registered users
                  const updatedUsers = registeredUsers.map(u => u.id === updatedUser.id ? { ...u, tier } : u);
                  setRegisteredUsers(updatedUsers);
                  localStorage.setItem('jobtrackr_users', JSON.stringify(updatedUsers));
                  
                  showToast(`Plan updated to ${tier}!`);
                }} 
              />
            )}
            {activeTab === 'settings' && (
              <SettingsScreen state={state!} onUpdate={handleUpdateReminder} />
            )}
            {activeTab === 'detail' && selectedAppId && (
              <DetailScreen 
                appId={selectedAppId} 
                state={state!} 
                onBack={() => setActiveTab('dashboard')}
                setActiveTab={setActiveTab}
                copyToClipboard={copyToClipboard}
                onUpdateState={persistData}
                showToast={showToast}
                onDelete={handleDeleteApp}
              />
            )}
          </AnimatePresence>
        </div>
      </main>


      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddAppModal 
            onClose={() => setIsAddModalOpen(false)} 
            onSubmit={handleAddApp} 
            resumes={state?.resumes || []}
            coverLetters={state?.coverLetters || []}
            setActiveTab={setActiveTab}
          />
        )}
        {isLogModalOpen && selectedAppId && (
          <LogActivityModal 
            appId={selectedAppId}
            onClose={() => setIsLogModalOpen(false)}
            onSubmit={(activity) => handleLogActivity(selectedAppId, activity)}
          />
        )}
        {deleteConfirmAppId && (
          <DeleteConfirmModal
            app={state?.applications.find(a => a.id === deleteConfirmAppId)}
            onClose={() => setDeleteConfirmAppId(null)}
            onConfirm={() => {
              if (deleteConfirmAppId) {
                executeDeleteApp(deleteConfirmAppId);
                setDeleteConfirmAppId(null);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Specific Screens Components ---

function DashboardScreen({ applications, dueFollowUps, stats, onLogActivity, onMarkFollowUp, onViewDetail, searchQuery, onClearSearch, copyToClipboard, state }: any) {
  const columns = Object.values(ApplicationStatus);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('nudgeCenterCollapsed');
    if (saved !== null) return JSON.parse(saved);
    return window.innerWidth < 1024;
  });

  const toggleCollapse = () => {
    const newState = !isPanelCollapsed;
    setIsPanelCollapsed(newState);
    localStorage.setItem('nudgeCenterCollapsed', JSON.stringify(newState));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col lg:flex-row h-[calc(100vh-72px)] overflow-hidden"
    >
      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex flex-col bg-[#0f172a] transition-all duration-300">
        {applications.length === 0 && searchQuery ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#94a3b8]">
            <Search className="w-12 h-12 text-[#334155] mb-4" />
            <h3 className="text-lg font-bold text-[#f8fafc]">No results for "{searchQuery}"</h3>
            <p className="mt-2 mb-6 text-sm">Try adjusting your search terms.</p>
            <button onClick={onClearSearch} className="text-[#3b82f6] font-bold hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="kanban flex gap-6 p-8 overflow-x-auto h-full scrollbar-thin scrollbar-thumb-[#334155] scrollbar-track-transparent">
            {columns.map((status) => {
              const columnApps = applications.filter((a: any) => a.status === status);
              return (
                <div key={status} className="column flex flex-col w-[300px] shrink-0">
                  <div className="flex items-center justify-between mb-6 border-b-2 border-[#334155] pb-2 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#f8fafc]">{STATUS_LABELS[status] || status}</span>
                    <span className="text-[10px] font-bold text-[#64748b] bg-[#1e293b] px-2 py-0.5 rounded-full">{columnApps.length}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {columnApps.map((app: any) => {
                      const isDue = dueFollowUps.some((d: any) => d.id === app.id);
                      const milestoneCount = Object.values(app.milestones || {}).filter(Boolean).length;
                      return (
                        <div key={app.id} className="bg-[#111827] border border-[#334155] p-5 rounded-xl hover:border-[#3b82f6]/50 transition-all cursor-pointer group shadow-sm" onClick={() => onViewDetail(app.id)}>
                          <div className="flex justify-between items-start mb-3">
                             {isDue && <Badge variant="urgent">Follow-up Due</Badge>}
                             {!isDue && app.recruiterContacts?.length > 0 && (
                               <div className="flex items-center gap-2">
                                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#3b82f6] uppercase tracking-tighter shrink-0">
                                   <UserIcon className="w-3 h-3" />
                                   <span className="truncate max-w-[80px]">
                                     {app.recruiterContacts[0].name}
                                   </span>
                                 </div>
                                 {app.recruiterContacts[0].email && (
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); copyToClipboard(app.recruiterContacts[0].email); }}
                                     className="p-1.5 bg-[#3b82f6]/10 rounded-md text-[#3b82f6] hover:bg-[#3b82f6] hover:text-[#0b1121] transition-all group/copy"
                                     title={`Copy ${app.recruiterContacts[0].email}`}
                                   >
                                     <Mail className="w-3 h-3 shrink-0" />
                                   </button>
                                 )}
                               </div>
                             )}
                          </div>
                          <div className="font-bold text-[15px] text-[#f8fafc] leading-tight mb-1 group-hover:text-[#3b82f6] transition-colors">{app.company}</div>
                          <div className="text-[13px] text-[#94a3b8] font-medium">{app.role}</div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#334155]/50">
                            <div className="flex items-center gap-2 text-[11px] text-[#64748b] font-bold">
                              <CheckCircle2 className={cn("w-3.5 h-3.5", milestoneCount > 0 ? "text-[#10b981]" : "text-[#334155]")} />
                              <span>{milestoneCount}/5 Progress</span>
                            </div>
                            <div className="text-[11px] text-[#64748b] font-bold uppercase">{format(parseISO(app.dateApplied), 'MMM d')}</div>
                          </div>
                        </div>
                      );
                    })}
                    {columnApps.length === 0 && (
                      <div className="h-24 flex items-center justify-center border border-dashed border-[#334155] rounded-xl bg-[#1e293b]/10">
                        <p className="text-[#334155] text-[10px] font-bold uppercase tracking-widest text-center">No Applications</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collapsed Pill Button */}
      {isPanelCollapsed && (
        <button 
          onClick={toggleCollapse}
          className="fixed right-6 bottom-6 lg:static lg:flex flex-col items-center py-8 bg-[#0b1121] border-l border-[#334155] w-16 group hover:bg-[#1e293b] transition-all z-20 h-full"
        >
          <Bell className="w-5 h-5 text-[#f59e0b] mb-6" />
          <div className="[writing-mode:vertical-lr] text-[10px] font-bold text-[#64748b] uppercase tracking-widest flex items-center gap-4">
            Nudge Center
            <span className="bg-[#f59e0b] text-[#0b1121] py-1 px-1.5 rounded-full not-italic">{dueFollowUps.length}</span>
          </div>
          <div className="mt-auto">
            <ChevronRight className="w-5 h-5 text-[#334155] group-hover:text-[#f8fafc] rotate-180 transition-all" />
          </div>
        </button>
      )}

      {/* Nudge Center Panel */}
      <AnimatePresence>
        {!isPanelCollapsed && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="bg-[#0b1121] border-l border-[#334155] flex flex-col h-full shrink-0"
          >
            <div className="p-8 flex flex-col gap-10 h-full overflow-y-auto scrollbar-hide w-[360px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest italic">Nudge Center</h3>
                  {dueFollowUps.length > 0 && <span className="bg-[#f59e0b] text-[#0b1121] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-[#f59e0b]/20">{dueFollowUps.length}</span>}
                </div>
                <button 
                  onClick={toggleCollapse} 
                  className="p-1.5 hover:bg-[#1e293b] rounded-lg transition-colors text-[#64748b] hover:text-[#f8fafc]"
                  aria-label="Collapse Nudge Center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e293b] border border-[#334155] p-5 rounded-2xl">
                    <div className="text-[10px] font-bold text-[#64748b] uppercase mb-1">Total Nudges</div>
                    <div className="text-2xl font-bold text-[#f59e0b]">{dueFollowUps.length}</div>
                  </div>
                  <div className="bg-[#1e293b] border border-[#334155] p-5 rounded-2xl">
                    <div className="text-[10px] font-bold text-[#64748b] uppercase mb-1">Due Today</div>
                    <div className="text-2xl font-bold text-[#f8fafc]">{dueFollowUps.filter((a: any) => differenceInDays(new Date(), parseISO(a.nextFollowUpAt)) === 0).length}</div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#f8fafc] mb-6">Action Required</h3>
                <div className="flex flex-col gap-4">
                  {dueFollowUps.length > 0 ? dueFollowUps.map((app: any) => (
                    <div key={app.id} className="border border-[#334155] bg-[#111827] rounded-xl p-5 flex flex-col gap-3 shadow-md hover:border-[#f59e0b]/30 transition-all cursor-pointer" onClick={() => onViewDetail(app.id)}>
                      <div className="flex justify-between items-center">
                        <div className="text-[10px] font-bold text-[#f59e0b] uppercase bg-[#f59e0b]/10 px-2 py-0.5 rounded">REPLY DUE</div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(app.recruiterEmail); }}
                          className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors text-[#94a3b8]"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-[#f8fafc]">{app.company}</div>
                        <div className="text-[12px] text-[#94a3b8]">{app.role}</div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onMarkFollowUp(app.id); }}
                        className="mt-2 w-full text-[11px] font-bold text-[#0b1121] bg-[#3b82f6] px-3 py-2.5 rounded-lg hover:bg-[#60a5fa] transition-all"
                      >
                        Mark Follow-up Sent
                      </button>
                    </div>
                  )) : (
                    <div className="text-center py-12 border border-dashed border-[#334155] rounded-2xl bg-[#1e293b]/20">
                      <p className="text-[#64748b] text-xs font-medium italic">Everything up to date</p>
                    </div>
                  )}
                </div>
              </div>

      <div className="space-y-6 pt-6 border-t border-[#334155]">
                <h3 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest italic flex items-center justify-between">
                  Pipeline Overview
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Total Apps', value: state?.applications?.length || 0, color: 'text-[#f8fafc]' },
                    { label: STATUS_LABELS[ApplicationStatus.Applied], value: state?.applications?.filter((a: any) => a.status === ApplicationStatus.Applied).length || 0, color: 'text-[#3b82f6]' },
                    { label: STATUS_LABELS[ApplicationStatus.RecruiterEmailed], value: state?.applications?.filter((a: any) => a.status === ApplicationStatus.RecruiterEmailed).length || 0, color: 'text-[#8b5cf6]' },
                    { label: STATUS_LABELS[ApplicationStatus.ResponseReceived], value: state?.applications?.filter((a: any) => a.status === ApplicationStatus.ResponseReceived).length || 0, color: 'text-[#06b6d4]' },
                    { label: STATUS_LABELS[ApplicationStatus.InterviewScheduled], value: state?.applications?.filter((a: any) => a.status === ApplicationStatus.InterviewScheduled).length || 0, color: 'text-[#f59e0b]' },
                    { label: STATUS_LABELS[ApplicationStatus.Offer], value: state?.applications?.filter((a: any) => a.status === ApplicationStatus.Offer).length || 0, color: 'text-[#10b981]' },
                  ].map((s: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-[#1e293b]/30 p-3 rounded-xl border border-[#334155]/30">
                      <div className="text-[10px] font-bold text-[#64748b] uppercase">{s.label}</div>
                      <div className={cn("text-sm font-bold", s.color)}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddAppModal({ onClose, onSubmit, resumes, coverLetters, setActiveTab }: any) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    dateApplied: format(new Date(), 'yyyy-MM-dd'),
    resumeVersionId: resumes[0]?.id || '',
    coverLetterId: '',
    jobId: '',
    notes: '',
    recruiterContacts: [{ name: '', email: '', title: '' }]
  });

  const [activeStep, setActiveStep] = useState(1);

  const addRecruiter = () => {
    setFormData({
      ...formData,
      recruiterContacts: [...formData.recruiterContacts, { name: '', email: '', title: '' }]
    });
  };

  const removeRecruiter = (index: number) => {
    setFormData({
      ...formData,
      recruiterContacts: formData.recruiterContacts.filter((_, i) => i !== index)
    });
  };

  const updateRecruiter = (index: number, field: string, value: string) => {
    const newContacts = [...formData.recruiterContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormData({ ...formData, recruiterContacts: newContacts });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#080c17]/90 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="bg-[#111827] border border-[#334155] w-full max-w-2xl rounded-2xl shadow-2xl relative z-[101] overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-[#334155] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#f8fafc]">New Application</h2>
            <p className="text-xs text-[#94a3b8] mt-1">Track your next big opportunity.</p>
          </div>
          <div className="flex gap-1">
            {[1, 2].map(s => (
              <div key={s} className={cn("w-8 h-1 rounded-full bg-[#334155]", activeStep >= s && "bg-[#3b82f6]")} />
            ))}
          </div>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 max-h-[75vh] overflow-y-auto">
          {activeStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Company*</label>
                  <input 
                    required
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f8fafc]"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Role*</label>
                  <input 
                    required
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f8fafc]"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Date Applied*</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f8fafc]"
                    value={formData.dateApplied}
                    onChange={e => setFormData({ ...formData, dateApplied: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Job ID</label>
                  <input 
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f8fafc]"
                    placeholder="e.g. #12345"
                    value={formData.jobId}
                    onChange={e => setFormData({ ...formData, jobId: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Resume Version*</label>
                <div className="relative">
                  {resumes.length === 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="w-full bg-[#1e293b] border border-dashed border-red-500/50 rounded-lg p-4 text-center">
                        <p className="text-xs text-red-400 font-bold mb-2">No resumes uploaded yet</p>
                        <button 
                          type="button"
                          onClick={() => { onClose(); setActiveTab('resumes'); }}
                          className="text-[10px] font-bold text-[#3b82f6] hover:underline uppercase"
                        >
                          Go to Resume Library →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <select 
                        required
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f8fafc] appearance-none"
                        value={formData.resumeVersionId}
                        onChange={e => setFormData({ ...formData, resumeVersionId: e.target.value })}
                      >
                        <option value="" disabled>Select a resume version</option>
                        {resumes.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.label} — {r.fileName}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Cover Letter (Optional)</label>
                <div className="relative">
                  {coverLetters.length === 0 ? (
                    <div className="w-full bg-[#1e293b] border border-dashed border-[#334155] rounded-lg p-3 text-center">
                      <p className="text-[10px] text-[#64748b] font-bold">No cover letters in library</p>
                    </div>
                  ) : (
                    <>
                      <select 
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f8fafc] appearance-none"
                        value={formData.coverLetterId}
                        onChange={e => setFormData({ ...formData, coverLetterId: e.target.value })}
                      >
                        <option value="">None / Handled manually</option>
                        {coverLetters.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.label} — {c.fileName}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Personal Notes</label>
                <textarea 
                  rows={3}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] resize-none text-[#f8fafc]"
                  placeholder="Referrals, specific interview prep, etc."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-[#334155] hover:bg-[#1e293b] py-3 rounded-xl font-bold text-sm transition-all text-[#94a3b8]"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="btn-primary flex-1 py-3 text-sm"
                >
                  Next: Recruiters
                </button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-[#f8fafc]">Recruiter Contacts</h3>
                <button 
                  type="button" 
                  onClick={addRecruiter}
                  className="text-[10px] font-bold text-[#3b82f6] hover:text-[#60a5fa] uppercase tracking-widest flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Another
                </button>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                {formData.recruiterContacts.map((contact, idx) => (
                  <div key={idx} className="p-4 bg-[#1e293b] border border-[#334155] rounded-xl relative group">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest px-1">Name</label>
                        <input 
                          placeholder="John Recruiter"
                          className="w-full bg-[#111827] border border-[#334155] rounded-lg p-2 text-xs text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                          value={contact.name}
                          onChange={e => updateRecruiter(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-[#64748b] uppercase tracking-widest px-1">Email</label>
                        <input 
                          type="email"
                          placeholder="john@company.com"
                          className="w-full bg-[#111827] border border-[#334155] rounded-lg p-2 text-xs text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                          value={contact.email}
                          onChange={e => updateRecruiter(idx, 'email', e.target.value)}
                        />
                      </div>
                    </div>
                    {formData.recruiterContacts.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeRecruiter(idx)}
                        className="absolute -top-2 -right-2 bg-red-500/20 text-red-500 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {formData.recruiterContacts.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-[#334155] rounded-xl">
                    <p className="text-[#64748b] text-xs">No recruiters added (Optional)</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="flex-1 border border-[#334155] hover:bg-[#1e293b] py-3 rounded-xl font-bold text-sm transition-all text-[#94a3b8]"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-1 py-3 text-sm font-bold"
                >
                  Create Application
                </button>
              </div>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}

function LogActivityModal({ appId, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    type: ActivityType.Note,
    summary: '',
    occurredAt: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#080c17]/90 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-[#111827] border border-[#334155] w-full max-w-md rounded-2xl shadow-2xl relative z-[101] p-8"
      >
        <h2 className="text-xl font-bold mb-6 text-[#f8fafc]">Log Activity</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Type</label>
            <select 
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f8fafc]"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as ActivityType })}
            >
              {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Summary</label>
            <textarea 
              required
              rows={2}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] resize-none text-[#f8fafc]"
              placeholder="What happened?"
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Date & Time</label>
            <input 
              type="datetime-local"
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] text-[#f8fafc]"
              value={formData.occurredAt}
              onChange={e => setFormData({ ...formData, occurredAt: e.target.value })}
            />
          </div>
          <div className="flex gap-4 mt-8">
            <button type="button" onClick={onClose} className="flex-1 border border-[#334155] hover:bg-[#1e293b] py-3 rounded-lg font-bold text-[#94a3b8] text-sm">Cancel</button>
            <button type="submit" className="btn-primary flex-1 py-3 text-sm">Log Entry</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DeleteConfirmModal({ app, onClose, onConfirm }: any) {
  if (!app) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#080c17]/90 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-[#111827] border border-[#334155] w-full max-w-md rounded-2xl shadow-2xl relative z-[111] p-8"
      >
        <h2 className="text-xl font-black mb-4 text-[#f8fafc] tracking-tight">Delete application?</h2>
        <p className="text-sm text-[#94a3b8] leading-relaxed mb-8">
          Are you sure you want to delete <span className="text-[#f8fafc] font-bold">{app.company}</span> — <span className="text-[#f8fafc] font-bold">{app.role}</span>? This cannot be undone.
        </p>
        <div className="flex gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs uppercase tracking-widest font-black rounded-xl bg-transparent border border-[#334155] text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc] transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 text-xs uppercase tracking-widest font-black rounded-xl bg-red-500 text-[#0b1121] hover:bg-red-400 shadow-lg shadow-red-500/20 transition-all"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ApplicationsTable({ applications, searchQuery, onClearSearch, onLogActivity, onViewDetail, onEditDetail, onDelete, onMarkFollowUp, copyToClipboard, state }: any) {
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const filteredApps = useMemo(() => {
    let result = applications;
    if (filter !== 'All') {
      result = result.filter((a: any) => a.status === filter);
    }
    return result;
  }, [applications, filter]);

  const totalPages = Math.ceil(filteredApps.length / pageSize);
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApps.slice(start, start + pageSize);
  }, [filteredApps, currentPage, pageSize]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  // Adjust page after deletion if parent list shrunk below currentPage
  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilter('All')}
            className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all", filter === 'All' ? "bg-[#3b82f6] text-[#f8fafc]" : "bg-[#1e293b] border border-[#334155] text-[#94a3b8]")}
          >
            All
          </button>
          {Object.values(ApplicationStatus).map(s => (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase whitespace-nowrap transition-all", filter === s ? "bg-[#3b82f6] text-[#f8fafc]" : "bg-[#1e293b] border border-[#334155] text-[#94a3b8]")}
              >
                {STATUS_LABELS[s] || s}
              </button>
          ))}
        </div>
      </div>

      {filteredApps.length === 0 && searchQuery ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 text-[#334155] mb-4" />
          <h3 className="text-lg font-bold text-[#f8fafc]">No matches found</h3>
          <p className="text-[#94a3b8] mt-2 mb-6">We couldn't find any results for "{searchQuery}"</p>
          <button 
            onClick={onClearSearch}
            className="text-[#3b82f6] font-bold hover:underline"
          >
            Clear and show all
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e293b]/50 border-b border-[#334155]">
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Company & Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest text-center">Date Applied</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest text-center">Follow-up</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {paginatedApps.map((app: any, index: number) => (
                  <tr key={app.id} className="hover:bg-[#1e293b]/30 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] font-bold text-[#334155] group-hover:text-[#64748b]">
                        {(currentPage - 1) * pageSize + index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[14px] text-[#f8fafc]">{app.company}</div>
                      <div className="text-[12px] text-[#94a3b8]">{app.role}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge>{STATUS_LABELS[app.status] || app.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] font-bold text-[#64748b]">{format(parseISO(app.dateApplied), 'MMM d, yyyy')}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] font-bold text-[#94a3b8]">{format(parseISO(app.nextFollowUpAt), 'MMM d')}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onViewDetail(app.id)}
                          className="p-2 hover:bg-[#3b82f6]/10 rounded-lg text-[#3b82f6]"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(app.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 text-[#64748b]">
            <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest">
              <span className="text-[#334155]">Page Size</span>
              <select 
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-[#1e293b] border border-[#334155] rounded px-2 py-1 outline-none text-[#f8fafc]"
              >
                {[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-[11px] font-bold uppercase tracking-widest">
                Page <span className="text-[#f8fafc]">{currentPage}</span> of <span className="text-[#f8fafc]">{Math.max(1, totalPages)}</span>
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-2 bg-[#1e293b] border border-[#334155] rounded-xl hover:bg-[#334155] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowUpRight className="w-4 h-4 rotate-[225deg]" />
                </button>
                <button 
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-2 bg-[#1e293b] border border-[#334155] rounded-xl hover:bg-[#334155] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowUpRight className="w-4 h-4 rotate-45" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatsScreen({ state, allStats, onAddApp }: { state: AppState, allStats: any, onAddApp: () => void }) {
  if (!allStats) return null;
  const { kpis, pieData, colors } = allStats;
  const hasApps = state.applications.length > 0;

  if (!hasApps) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto h-[60vh]">
        <div className="w-20 h-20 bg-[#1e293b] rounded-3xl flex items-center justify-center mb-6 border border-[#334155] shadow-xl">
          <Briefcase className="w-10 h-10 text-[#3b82f6]" />
        </div>
        <h2 className="text-2xl font-black text-[#f8fafc] mb-3">No applications yet</h2>
        <p className="text-[#94a3b8] mb-8 leading-relaxed">Start tracking your career journey. Add your first job application to see the pipeline analytics.</p>
        <button 
          onClick={onAddApp}
          className="btn-primary px-8 py-4 text-sm flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Add Your First Application
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {kpis.map((s: any, i: number) => (
          <div key={i} className="bg-[#111827] border border-[#334155] p-6 rounded-2xl shadow-sm hover:border-[#3b82f6]/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 rounded-lg bg-[#1e293b]/50", s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest">{s.label}</span>
            </div>
            <div className="text-3xl font-bold text-[#f8fafc] tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-12">
        <div className="bg-[#111827] border border-[#334155] p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-widest flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#3b82f6]" />
              Pipeline Velocity
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px', padding: '12px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '800' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`velocity-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#334155] p-8 rounded-3xl shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-widest mb-2">Pipeline Overview</h3>
          <p className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider mb-8">Status Distribution & Counts</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#1e293b]/50 rounded-2xl p-4 border border-[#334155]/50">
              <div className="text-[10px] font-bold text-[#64748b] uppercase mb-1">Active Apps</div>
              <div className="text-2xl font-black text-[#f8fafc]">{state.applications.filter(a => a.status !== ApplicationStatus.Rejected).length}</div>
            </div>
            <div className="bg-[#1e293b]/50 rounded-2xl p-4 border border-[#334155]/50 text-right">
              <div className="text-[10px] font-bold text-[#64748b] uppercase mb-1">Grand Total</div>
              <div className="text-2xl font-black text-[#f8fafc]">{state.applications.length}</div>
            </div>
          </div>

          <div className="h-56 mb-8 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`overview-pie-${index}`} fill={colors[index % colors.length]} stroke="rgba(255,255,255,0.02)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-[#f8fafc] leading-none mb-1">{state.applications.length}</span>
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-tighter">Total Apps</span>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-60 pr-2 custom-scrollbar">
            {pieData.map((entry: any, index: number) => {
              const percentage = ((entry.value / state.applications.length) * 100).toFixed(0);
              return (
                <div key={index} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="text-[13px] font-bold text-[#94a3b8] group-hover:text-[#f8fafc] transition-colors">{entry.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-[#f8fafc]">{entry.value}</span>
                    <span className="text-[10px] font-bold text-[#64748b]">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PricingScreen({ user, onUpdateTier }: { user: User, onUpdateTier: (tier: 'Free' | 'Pro') => void }) {
  const plans = [
    {
      id: 'Free',
      name: 'Starter',
      price: '$0',
      description: 'Perfect for casual job seekers.',
      features: [
        'Up to 25 active applications',
        'Basic Pipeline Dashboard',
        'Smart Nudges & Reminders',
        'Standard Resume Library'
      ],
      cta: user.tier === 'Free' ? 'Current Plan' : 'Downgrade to Free'
    },
    {
      id: 'Pro',
      name: 'Career Pro',
      price: '$2.99',
      description: 'For serious high-growth careers.',
      features: [
        'Unlimited active applications',
        'Advanced Stats & Analytics',
        'Interview Prep Assistant',
        'Priority Technical Support'
      ],
      cta: user.tier === 'Pro' ? 'Current Plan' : 'Upgrade to Pro',
      popular: true
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-5xl mx-auto py-16">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-[#f8fafc] tracking-tight mb-4">Simple, transparent pricing.</h2>
        <p className="text-lg text-[#94a3b8]">Choose the plan that fits your career goals.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={cn(
              "bg-[#111827] border rounded-[2rem] p-10 flex flex-col relative transition-all duration-300",
              plan.popular ? "border-[#3b82f6] shadow-2xl shadow-[#3b82f6]/10" : "border-[#334155] opacity-80 hover:opacity-100"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#3b82f6] text-[#080c17] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold text-[#f8fafc] mb-2">{plan.name}</h3>
              <p className="text-sm text-[#64748b] leading-relaxed">{plan.description}</p>
            </div>

            <div className="mb-10">
              <span className="text-5xl font-black text-[#f8fafc] tracking-tighter">{plan.price}</span>
              <span className="text-[#64748b] font-bold text-sm ml-2 uppercase tracking-widest">/ month</span>
            </div>

            <div className="space-y-4 mb-12 flex-1">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#3b82f6] shrink-0" />
                  <span className="text-[#94a3b8] text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => plan.id !== user.tier && onUpdateTier(plan.id as 'Free' | 'Pro')}
              disabled={plan.id === user.tier}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm transition-all duration-300 uppercase tracking-widest",
                plan.id === user.tier
                  ? "bg-[#1e293b] text-[#64748b] border border-[#334155] cursor-default"
                  : plan.popular
                    ? "bg-[#3b82f6] text-[#080c17] hover:bg-[#60a5fa] shadow-xl shadow-[#3b82f6]/20"
                    : "bg-transparent border-2 border-[#334155] text-[#f8fafc] hover:bg-[#1e293b]"
              )}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SettingsScreen({ state, onUpdate }: { state: AppState, onUpdate: (days: number, enabled: boolean) => void }) {
  const [days, setDays] = useState(state.reminderRules[0].daysNoResponse);
  const [enabled, setEnabled] = useState(state.reminderRules[0].enabled);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-2xl space-y-8">
      <section className="bg-[#111827] border border-[#334155] rounded-xl p-8 shadow-sm">
        <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-widest mb-8 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#3b82f6]" />
          Automation Rules
        </h3>
        
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[15px] font-bold text-[#f8fafc]">Smart Nudges</div>
              <div className="text-xs text-[#64748b] mt-0.5">Auto-flag applications needing attention</div>
            </div>
            <button 
              onClick={() => setEnabled(!enabled)}
              className={cn("w-10 h-5 rounded-full relative transition-all duration-200", enabled ? "bg-[#3b82f6]" : "bg-[#334155]")}
            >
              <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", enabled ? "left-6" : "left-1")} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#1e293b] p-4 rounded-lg border border-[#334155]">
              <span className="text-sm font-bold text-[#f8fafc]">Follow-up Threshold</span>
              <span className="text-sm font-bold text-[#3b82f6]">{days} days</span>
            </div>
            <input 
              type="range" 
              min="3" 
              max="21" 
              value={days}
              onChange={e => setDays(parseInt(e.target.value))}
              className="w-full h-1 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
            />
          </div>

          <button 
            onClick={() => onUpdate(days, enabled)}
            className="btn-primary w-full py-4 text-sm"
          >
            Save Settings
          </button>
        </div>
      </section>
    </motion.div>
  );
}

function AuthFlow({ onLogin, onSignUp, onResetPassword, users, error }: { onLogin: (e: string, p: string) => void, onSignUp: (n: string, e: string, p: string) => void, onResetPassword: (e: string, p: string) => void, users: User[], error: string | null }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(formData.email);
  const isResetEmailValid = emailRegex.test(resetEmail);

  const passwordRules = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };

  const isPasswordStrong = Object.values(passwordRules).every(Boolean);
  const isPasswordMatch = formData.password === formData.confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      if (!isEmailValid || !formData.password) return;
      onLogin(formData.email, formData.password);
    } else if (mode === 'signup') {
      if (!isEmailValid || !isPasswordStrong || !isPasswordMatch) return;
      onSignUp(formData.name, formData.email, formData.password);
    } else if (mode === 'forgot') {
      if (!isResetEmailValid) return;
      const userExists = users.some(u => u.email === resetEmail);
      if (userExists) {
        setMode('reset');
      } else {
        setMode('forgot');
        // Still say success for privacy as per requirement
        alert('If an account exists, a reset link was sent.'); 
      }
    } else if (mode === 'reset') {
      if (!isPasswordStrong || !isPasswordMatch) return;
      onResetPassword(resetEmail, formData.password);
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-[#080c17] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e1b4b,transparent_70%)] opacity-30" />
      
      <motion.div 
        key={mode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111827]/80 backdrop-blur-xl border border-[#334155] p-10 rounded-[2rem] shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-[#3b82f6] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#3b82f6]/20">
            <TrendingUp className="w-7 h-7 text-[#080c17]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#f8fafc] tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 
             mode === 'signup' ? 'Join JobTrackr' : 
             mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-[#94a3b8] text-xs font-medium mt-1">
            {mode === 'login' ? 'Continue your intelligent job hunt.' : 
             mode === 'signup' ? 'Create your smart application pipeline.' :
             mode === 'forgot' ? 'Enter your email to reset your password.' : 'Enter your new strong password.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'forgot' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Email Address</label>
              <input 
                required
                type="email"
                placeholder="user@jobtrackr.com"
                className={cn(
                  "w-full bg-[#1e293b] border border-[#334155] rounded-xl py-3 px-4 text-sm text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none",
                  resetEmail && !isResetEmailValid && "border-red-500/50"
                )}
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
              />
              {resetEmail && !isResetEmailValid && <p className="text-[10px] text-red-500 font-bold px-1">Please enter a valid email.</p>}
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <>
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    required
                    type="text"
                    placeholder="Jane Doe"
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl py-3 px-4 text-sm text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    required
                    type="email"
                    placeholder="user@jobtrackr.com"
                    className={cn(
                      "w-full bg-[#1e293b] border border-[#334155] rounded-xl py-3 px-4 text-sm text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none",
                      formData.email && !isEmailValid && "border-red-500/50"
                    )}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                  {formData.email && !isEmailValid && <p className="text-[10px] text-red-500 font-bold px-1">Please enter a valid email.</p>}
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Password</label>
                  <input 
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-xl py-3 px-4 text-sm text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  {mode === 'login' && (
                    <div className="text-right mt-1">
                      <button 
                        type="button" 
                        onClick={() => { setMode('forgot'); setFormData({ ...formData, email: '', password: '', confirmPassword: '' }); }}
                        className="text-[10px] font-bold text-[#3b82f6] hover:underline"
                      >
                        Forgot password
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-2 mt-2 px-1">
                    {Object.entries(passwordRules).map(([key, valid]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", valid ? "bg-green-500" : "bg-slate-700")} />
                        <span className={cn("text-[9px] font-bold uppercase tracking-tighter", valid ? "text-green-500" : "text-slate-500")}>
                          {key === 'length' ? '8+ chars' : 
                           key === 'upper' ? 'Uppercase' : 
                           key === 'lower' ? 'Lowercase' : 
                           key === 'number' ? 'Number' : 'Special'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Confirm Password</label>
                    <input 
                      required
                      type="password"
                      placeholder="••••••••"
                      className={cn(
                        "w-full bg-[#1e293b] border border-[#334155] rounded-xl py-3 px-4 text-sm text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none",
                        formData.confirmPassword && !isPasswordMatch && "border-red-500/50"
                      )}
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {mode === 'reset' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">New Password</label>
                <input 
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl py-3 px-4 text-sm text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2 mt-2 px-1">
                  {Object.entries(passwordRules).map(([key, valid]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full", valid ? "bg-green-500" : "bg-slate-700")} />
                      <span className={cn("text-[9px] font-bold uppercase tracking-tighter", valid ? "text-green-500" : "text-slate-500")}>
                        {key === 'length' ? '8+ chars' : 
                         key === 'upper' ? 'Uppercase' : 
                         key === 'lower' ? 'Lowercase' : 
                         key === 'number' ? 'Number' : 'Special'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Confirm New Password</label>
                <input 
                  required
                  type="password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full bg-[#1e293b] border border-[#334155] rounded-xl py-3 px-4 text-sm text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none",
                    formData.confirmPassword && !isPasswordMatch && "border-red-500/50"
                  )}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </>
          )}

          {error && <div className="text-red-400 text-[11px] font-bold text-center px-2">{error}</div>}

          <button 
            type="submit"
            disabled={
              (mode === 'login' && (!isEmailValid || !formData.password)) ||
              (mode === 'signup' && (!isEmailValid || !isPasswordStrong || !isPasswordMatch)) ||
              (mode === 'forgot' && !isResetEmailValid) ||
              (mode === 'reset' && (!isPasswordStrong || !isPasswordMatch))
            }
            className="w-full bg-[#3b82f6] text-[#080c17] py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-[#3b82f6]/20 hover:bg-[#60a5fa] transition-all disabled:opacity-50 disabled:hover:bg-[#3b82f6]"
          >
            {mode === 'login' ? 'Log in' : 
             mode === 'signup' ? 'Create account' : 
             mode === 'forgot' ? 'Reset Password' : 'Reset password'}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col items-center gap-4">
          {(mode === 'login' || mode === 'signup') ? (
            <button 
              onClick={() => { 
                  const newMode = mode === 'login' ? 'signup' : 'login';
                  setMode(newMode); 
                  setFormData({ name: '', email: '', password: '', confirmPassword: '' }); 
                  setResetEmail('');
              }}
              className="text-[11px] font-bold text-[#94a3b8] hover:text-[#3b82f6] transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Create one" : "Already have an account? Log in"}
            </button>
          ) : (
            <button 
              onClick={() => setMode('login')}
              className="text-[11px] font-bold text-[#3b82f6] hover:underline flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5 rotate-[225deg]" />
              Back to Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DetailScreen({ appId, state, onBack, setActiveTab, copyToClipboard, onUpdateState, showToast, onDelete }: any) {
  const app = state.applications.find((a: any) => a.id === appId);
  const [editFormData, setEditFormData] = useState<any>(null);

  useEffect(() => {
    if (app && !editFormData) {
      setEditFormData({
        ...app,
        recruiterContacts: app.recruiterContacts || []
      });
    }
  }, [app]);

  const updateApplication = (id: string, updates: Partial<Application>) => {
    if (!state) return;
    const updatedApps = state.applications.map(app => {
      if (app.id === id) {
        const nextApp = { ...app, ...updates, lastTouchpointAt: new Date().toISOString() };
        if (updates.milestones) {
          nextApp.status = computeStatusFromMilestones(updates.milestones);
        }
        return nextApp;
      }
      return app;
    });
    onUpdateState({ ...state, applications: updatedApps });
  };

  const logs = state.activityLogs
    .filter((l: any) => l.applicationId === appId)
    .sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  if (!app) return <div className="p-8 text-center text-[#94a3b8]">Application not found</div>;

  const handleSave = () => {
    if (!editFormData) return;
    
    // VALIDATION
    if (!editFormData.company || !editFormData.role) {
      showToast('Company and Role are required');
      return;
    }

    // Determine status from milestones if they exist
    const finalMilestones = editFormData.milestones;
    const finalStatus = finalMilestones ? computeStatusFromMilestones(finalMilestones) : editFormData.status;

    const now = new Date().toISOString();

    // Create ONE summary log for update
    const updateLog: ActivityLog = {
      id: crypto.randomUUID(),
      applicationId: appId,
      type: ActivityType.Note,
      summary: "Application updated",
      occurredAt: now
    };

    const updatedApps = state.applications.map((a: any) => 
      a.id === appId ? { 
        ...editFormData, 
        status: finalStatus,
        lastTouchpointAt: now 
      } : a
    );

    onUpdateState({
      ...state,
      applications: updatedApps,
      activityLogs: [updateLog, ...state.activityLogs]
    });
    
    showToast('Changes saved');
  };

  const toggleMilestone = (key: string) => {
    if (!editFormData) return;
    const newMilestones = { ...editFormData.milestones, [key]: !editFormData.milestones[key as keyof typeof editFormData.milestones] };
    
    if (key === 'rejected' && newMilestones.rejected) newMilestones.offerReceived = false;
    if (key === 'offerReceived' && newMilestones.offerReceived) newMilestones.rejected = false;

    setEditFormData({ ...editFormData, milestones: newMilestones });
  };

  const milestones = [
    { key: 'recruiterEmailed', label: 'Recruiter Emailed', description: 'Initial outreach or cold email sent' },
    { key: 'responseReceived', label: 'Response Received', description: 'Heard back from the company' },
    { key: 'interviewScheduled', label: 'Landed an Interview', description: 'First round or phone screen booked' },
    { key: 'offerReceived', label: 'Offer Received', description: 'Congratulations! Official offer in hand' },
    { key: 'rejected', label: 'Rejected', description: 'Application closed or rejected' },
  ];

  const AddRecruiterToForm = () => {
    setEditFormData({
      ...editFormData,
      recruiterContacts: [...editFormData.recruiterContacts, { id: crypto.randomUUID(), applicationId: appId, name: '', email: '', title: '', createdAt: new Date().toISOString() }]
    });
  };

  const UpdateRecruiterInForm = (idx: number, field: string, value: string) => {
    const contacts = [...editFormData.recruiterContacts];
    contacts[idx] = { ...contacts[idx], [field]: value };
    setEditFormData({ ...editFormData, recruiterContacts: contacts });
  };

  const RemoveRecruiterFromForm = (idx: number) => {
    setEditFormData({
      ...editFormData,
      recruiterContacts: editFormData.recruiterContacts.filter((_: any, i: number) => i !== idx)
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-12 max-w-5xl mx-auto pb-32">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-[11px] font-bold text-[#64748b] uppercase tracking-widest hover:text-[#f8fafc] transition-all">
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex gap-4">
          <button 
            type="button"
            onClick={() => onDelete(app.id)}
            className="flex items-center gap-1.5 px-4 py-2 border border-red-500/30 bg-transparent hover:bg-red-500/15 text-red-500 text-xs font-bold rounded-xl transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
          <button 
            onClick={() => { setEditFormData(null); onBack(); }}
            className="btn-secondary px-6 py-2 text-xs"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="btn-primary px-8 py-2 text-xs font-bold"
          >
            Save Changes
          </button>
          <Badge variant={app.status === 'Rejected' ? 'warn' : app.status === 'Offer' ? 'success' : 'default'}>{STATUS_LABELS[app.status] || app.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        <div className="space-y-12">
          <section>
            {editFormData && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Company</label>
                    <input 
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-lg font-bold text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none"
                      value={editFormData.company}
                      onChange={e => setEditFormData({ ...editFormData, company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Role</label>
                    <input 
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-lg font-bold text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none"
                      value={editFormData.role}
                      onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Status</label>
                    <select 
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-sm font-bold text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none appearance-none"
                      value={editFormData.status}
                      onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                    >
                      {Object.values(ApplicationStatus).map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Applied Date</label>
                    <input 
                      type="date"
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-sm font-bold text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none"
                      value={editFormData.dateApplied.split('T')[0]}
                      onChange={e => setEditFormData({ ...editFormData, dateApplied: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="bg-[#111827] border border-[#334155] p-8 rounded-2xl">
            <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-widest mb-8 border-b border-[#334155] pb-4 flex items-center justify-between">
              <span>Progress Checklist</span>
              <span className="text-[10px] text-[#64748b]">AUTO-UPDATES STATUS</span>
            </h3>
            <div className="space-y-6">
              {milestones.map((milestone) => (
                <div 
                  key={milestone.key} 
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group",
                    editFormData?.milestones?.[milestone.key] 
                      ? "bg-[#3b82f6]/5 border-[#3b82f6]/30" 
                      : "bg-transparent border-[#334155] hover:border-[#3b82f6]/20"
                  )}
                  onClick={() => toggleMilestone(milestone.key)}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                    editFormData?.milestones?.[milestone.key]
                      ? "bg-[#3b82f6] border-[#3b82f6]"
                      : "border-[#334155] group-hover:border-[#3b82f6]/50"
                  )}>
                    {editFormData?.milestones?.[milestone.key] && <CheckCircle2 className="w-4 h-4 text-[#0b1121]" />}
                  </div>
                  <div className="flex-1">
                    <div className={cn("text-sm font-bold", editFormData?.milestones?.[milestone.key] ? "text-[#f8fafc]" : "text-[#94a3b8]")}>
                      {milestone.label}
                    </div>
                    <p className="text-[11px] text-[#64748b] mt-0.5">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mb-6 pb-2 border-b-2 border-[#334155]">Activity Timeline</h3>
            {logs.length > 0 ? (
              <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-0 before:w-[2px] before:bg-[#334155]">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex gap-6 relative">
                    <div className="mt-1 w-[14px] h-[14px] rounded-full bg-[#3b82f6] border-4 border-[#0f172a] shrink-0 z-10" />
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-bold text-[#f8fafc]">{log.type}</span>
                        <span className="text-[10px] font-bold text-[#64748b]">{format(parseISO(log.occurredAt), 'MMM d, HH:mm')}</span>
                      </div>
                      <p className="text-[13px] text-[#94a3b8] mt-1 italic">"{log.summary}"</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 border border-dashed border-[#334155] rounded-xl text-center">
                <p className="text-[#64748b] text-[11px] font-bold uppercase tracking-widest">No activity yet</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-[#1e293b] border border-[#334155] p-6 rounded-2xl space-y-6 shadow-xl">
            <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest border-b border-[#334155] pb-4 flex items-center justify-between">
              <span>Recruiter Contacts</span>
              <button onClick={AddRecruiterToForm} className="text-[10px] text-[#3b82f6] font-bold uppercase hover:underline">Add</button>
            </h3>
            <div className="space-y-6">
              {editFormData?.recruiterContacts?.map((contact: any, idx: number) => (
                <div key={contact.id || idx} className="p-4 bg-[#0f172a] border border-[#334155] rounded-xl space-y-3 group transition-all hover:border-[#3b82f6]/40 relative">
                  <div className="space-y-3">
                    <input 
                      className="w-full bg-[#1e293b] border border-[#334155] rounded p-2 text-xs text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none"
                      placeholder="Name"
                      value={contact.name}
                      onChange={e => UpdateRecruiterInForm(idx, 'name', e.target.value)}
                    />
                    <input 
                      className="w-full bg-[#1e293b] border border-[#334155] rounded p-2 text-xs text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none"
                      placeholder="Email"
                      value={contact.email}
                      onChange={e => UpdateRecruiterInForm(idx, 'email', e.target.value)}
                    />
                    <input 
                      className="w-full bg-[#1e293b] border border-[#334155] rounded p-2 text-xs text-[#f8fafc] focus:ring-1 focus:ring-[#3b82f6] outline-none"
                      placeholder="Title (Recruiter, HM, etc.)"
                      value={contact.title}
                      onChange={e => UpdateRecruiterInForm(idx, 'title', e.target.value)}
                    />
                    <button 
                      onClick={() => RemoveRecruiterFromForm(idx)}
                      className="text-[10px] text-red-500 font-bold uppercase hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {(!editFormData?.recruiterContacts || editFormData.recruiterContacts.length === 0) && (
                <div className="text-center py-6 border border-dashed border-[#334155] rounded-xl opacity-50 bg-[#0f172a]/50">
                   <p className="text-[#64748b] text-[10px] font-bold uppercase tracking-widest">No Contacts Added</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] p-6 rounded-2xl space-y-6 shadow-xl">
            <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest border-b border-[#334155] pb-4">Application Details</h3>
            <div className="space-y-5">
              <div>
                <div className="text-[10px] font-bold text-[#64748b] uppercase mb-2 flex items-center justify-between">
                  <span>Resume artifact</span>
                  <select 
                    className="text-[9px] bg-[#1e293b] border border-[#334155] text-[#3b82f6] font-bold uppercase rounded p-1 outline-none"
                    value={editFormData?.resumeVersionId}
                    onChange={e => setEditFormData({ ...editFormData, resumeVersionId: e.target.value })}
                  >
                    {state.resumes.map((r: any) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                {(() => {
                  const rId = editFormData?.resumeVersionId;
                  const resume = state.resumes.find((r: any) => r.id === rId);
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-[#0f172a] border border-[#334155] rounded-xl">
                        <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center border border-[#3b82f6]/20">
                          <FileText className="w-5 h-5 text-[#3b82f6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-[#f8fafc] truncate">{resume?.label || 'Unknown'}</div>
                          <div className="text-[10px] text-[#64748b] truncate uppercase font-bold tracking-tighter">{resume?.fileName || 'Reference deleted'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <div className="text-[10px] font-bold text-[#64748b] uppercase mb-2 flex items-center justify-between">
                  <span>Cover Letter artifact</span>
                  <select 
                    className="text-[9px] bg-[#1e293b] border border-[#334155] text-[#3b82f6] font-bold uppercase rounded p-1 outline-none"
                    value={editFormData?.coverLetterId || ''}
                    onChange={e => setEditFormData({ ...editFormData, coverLetterId: e.target.value })}
                  >
                    <option value="">None</option>
                    {state.coverLetters.map((c: any) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                {(() => {
                  const clId = editFormData?.coverLetterId;
                  const cl = state.coverLetters.find((c: any) => c.id === clId);
                  if (!cl) return (
                    <div className="p-4 border border-dashed border-[#334155] rounded-xl text-center opacity-50">
                      <p className="text-[10px] text-[#64748b] font-bold">No cover letter linked</p>
                    </div>
                  );
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-[#0f172a] border border-[#334155] rounded-xl">
                        <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center border border-[#8b5cf6]/20">
                          <Paperclip className="w-5 h-5 text-[#8b5cf6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-[#f8fafc] truncate">{cl.label}</div>
                          <div className="text-[10px] text-[#64748b] truncate uppercase font-bold tracking-tighter">{cl.fileName}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div>
                <div className="text-[10px] font-bold text-[#64748b] uppercase mb-1">Reference ID / JOB ID</div>
                <input 
                  className="w-full bg-[#111827] border border-[#334155] rounded p-2 text-xs font-mono text-[#f8fafc] outline-none"
                  value={editFormData?.jobId || ''}
                  onChange={e => setEditFormData({ ...editFormData, jobId: e.target.value })}
                />
              </div>
              
              <div className="pt-4 border-t border-[#334155]">
                <div className="text-[10px] font-bold text-[#64748b] uppercase mb-2">Internal Strategy Notes</div>
                <textarea 
                  rows={4}
                  className="w-full bg-[#0f172a] rounded-xl border border-[#334155] text-xs text-[#f8fafc] p-4 resize-none outline-none focus:ring-1 focus:ring-[#3b82f6]"
                  value={editFormData?.notes || ''}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ResumeLibraryScreen({ resumes, onUpdate, showToast }: { resumes: ResumeVersion[], onUpdate: (r: ResumeVersion[]) => void, showToast: (m: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [editingResume, setEditingResume] = useState<ResumeVersion | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Please upload a PDF file');
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await readFileAsBase64(file);
      const newResume: ResumeVersion = {
        id: crypto.randomUUID(),
        label: `v${resumes.length + 1}`,
        fileName: file.name,
        fileType: 'application/pdf',
        fileSizeKB: Math.round(file.size / 1024),
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        storageRef: base64,
        notes: ''
      };
      onUpdate([...resumes, newResume]);
      showToast('Resume uploaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload resume');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = (id: string) => {
    onUpdate(resumes.filter(r => r.id !== id));
    showToast('Resume deleted');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResume) return;
    onUpdate(resumes.map(r => r.id === editingResume.id ? editingResume : r));
    setEditingResume(null);
    showToast('Changes saved');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8 max-w-6xl mx-auto" id="resume-library">
      <div className="flex items-center justify-between" id="resume-library-header">
        <div>
          <h2 className="text-2xl font-bold text-[#f8fafc]">Resume Library</h2>
          <p className="text-[#94a3b8] text-sm mt-1">Manage your resume versions and artifacts.</p>
        </div>
        
        <label className="btn-primary cursor-pointer flex items-center gap-2 group" id="upload-resume-btn">
          <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,application/pdf" disabled={isUploading} />
          {isUploading ? (
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-[#0b1121] border-t-transparent rounded-full" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{isUploading ? 'Uploading...' : 'Upload Resume (PDF)'}</span>
        </label>
      </div>

      {resumes.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-[#334155] rounded-3xl flex flex-col items-center justify-center text-center bg-[#111827]/30" id="resume-empty-state">
          <div className="w-16 h-16 bg-[#1e293b] rounded-2xl flex items-center justify-center mb-6 text-[#334155]">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#f8fafc]">No resumes in library</h3>
          <p className="text-[#64748b] text-sm mt-2 max-w-sm">Upload your base resumes to start linking them to your applications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="resume-grid">
          {resumes.map((resume) => (
            <div key={resume.id} className="bg-[#111827] border border-[#334155] rounded-2xl p-6 flex flex-col gap-5 hover:border-[#3b82f6]/40 transition-all group shadow-sm" id={`resume-card-${resume.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-xl flex items-center justify-center text-[#3b82f6] border border-[#3b82f6]/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-[#f8fafc]">{resume.label}</div>
                    <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-tighter">{resume.fileType.split('/')[1]} • {resume.fileSizeKB}KB</div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingResume(resume)} className="p-2 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-[#3b82f6]" id={`edit-resume-${resume.id}`}>
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(resume.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-[#64748b] hover:text-red-500" id={`delete-resume-${resume.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-[#94a3b8] truncate mb-1">{resume.fileName}</div>
                <p className="text-[11px] text-[#64748b] line-clamp-2 italic h-[32px]">{resume.notes || 'No description added for this version.'}</p>
              </div>

              <div className="pt-5 border-t border-[#334155] flex items-center justify-between">
                <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
                  Updated {format(parseISO(resume.updatedAt), 'MMM d')}
                </div>
                <button 
                  onClick={() => downloadBase64File(resume.storageRef, resume.fileName)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#3b82f6] hover:text-[#60a5fa] uppercase tracking-widest"
                  id={`download-resume-${resume.id}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Metadata Modal */}
      <AnimatePresence>
        {editingResume && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingResume(null)} className="absolute inset-0 bg-[#080c17]/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-[#111827] border border-[#334155] w-full max-w-md rounded-2xl p-8 relative z-[211]" id="edit-resume-modal">
              <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Edit Resume Metadata</h3>
              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Label</label>
                  <input 
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-sm text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                    value={editingResume.label}
                    onChange={e => setEditingResume({ ...editingResume, label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">File Display Name</label>
                  <input 
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-sm text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                    value={editingResume.fileName}
                    onChange={e => setEditingResume({ ...editingResume, fileName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Version Notes</label>
                  <textarea 
                    rows={3}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-sm text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] resize-none"
                    value={editingResume.notes}
                    onChange={e => setEditingResume({ ...editingResume, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingResume(null)} className="flex-1 border border-[#334155] py-3 rounded-lg font-bold text-sm text-[#94a3b8] hover:bg-[#1e293b]" id="cancel-edit-resume">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 py-3 text-sm" id="save-edit-resume">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CoverLetterLibraryScreen({ coverLetters, onUpdate, showToast }: { coverLetters: CoverLetter[], onUpdate: (c: CoverLetter[]) => void, showToast: (m: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [editingCL, setEditingCL] = useState<CoverLetter | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Please upload a PDF file');
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await readFileAsBase64(file);
      const newCL: CoverLetter = {
        id: crypto.randomUUID(),
        label: `CL v${coverLetters.length + 1}`,
        fileName: file.name,
        fileType: 'application/pdf',
        fileSizeKB: Math.round(file.size / 1024),
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        storageRef: base64,
        notes: ''
      };
      onUpdate([...coverLetters, newCL]);
      showToast('Cover letter uploaded successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload cover letter');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = (id: string) => {
    onUpdate(coverLetters.filter(c => c.id !== id));
    showToast('Cover letter deleted');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCL) return;
    onUpdate(coverLetters.map(c => c.id === editingCL.id ? editingCL : c));
    setEditingCL(null);
    showToast('Changes saved');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#f8fafc]">Cover Letter Library</h2>
          <p className="text-[#94a3b8] text-sm mt-1">Manage your tailored cover letters.</p>
        </div>
        
        <label className="btn-primary cursor-pointer flex items-center gap-2 group">
          <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,application/pdf" disabled={isUploading} />
          {isUploading ? (
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-[#0b1121] border-t-transparent rounded-full" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{isUploading ? 'Uploading...' : 'Upload Cover Letter (PDF)'}</span>
        </label>
      </div>

      {coverLetters.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-[#334155] rounded-3xl flex flex-col items-center justify-center text-center bg-[#111827]/30">
          <div className="w-16 h-16 bg-[#1e293b] rounded-2xl flex items-center justify-center mb-6 text-[#334155]">
            <Paperclip className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#f8fafc]">No cover letters in library</h3>
          <p className="text-[#64748b] text-sm mt-2 max-w-sm">Upload your tailored cover letters to link them to specific applications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coverLetters.map((cl) => (
            <div key={cl.id} className="bg-[#111827] border border-[#334155] rounded-2xl p-6 flex flex-col gap-5 hover:border-[#3b82f6]/40 transition-all group shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-xl flex items-center justify-center text-[#8b5cf6] border border-[#8b5cf6]/20">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-[#f8fafc]">{cl.label}</div>
                    <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-tighter">{cl.fileType.split('/')[1]} • {cl.fileSizeKB}KB</div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingCL(cl)} className="p-2 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-[#3b82f6]">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cl.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-[#64748b] hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-[#94a3b8] truncate mb-1">{cl.fileName}</div>
                <p className="text-[11px] text-[#64748b] line-clamp-2 italic h-[32px]">{cl.notes || 'No notes added.'}</p>
              </div>

              <div className="pt-5 border-t border-[#334155] flex items-center justify-between">
                <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
                  Updated {format(parseISO(cl.updatedAt), 'MMM d')}
                </div>
                <button 
                  onClick={() => downloadBase64File(cl.storageRef, cl.fileName)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#3b82f6] hover:text-[#60a5fa] uppercase tracking-widest"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Metadata Modal */}
      <AnimatePresence>
        {editingCL && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingCL(null)} className="absolute inset-0 bg-[#080c17]/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-[#111827] border border-[#334155] w-full max-w-md rounded-2xl p-8 relative z-[211]">
              <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Edit Cover Letter Details</h3>
              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Label</label>
                  <input 
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-sm text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                    value={editingCL.label}
                    onChange={e => setEditingCL({ ...editingCL, label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1">Notes</label>
                  <textarea 
                    rows={3}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-2.5 text-sm text-[#f8fafc] focus:outline-none focus:ring-1 focus:ring-[#3b82f6] resize-none"
                    value={editingCL.notes}
                    onChange={e => setEditingCL({ ...editingCL, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingCL(null)} className="flex-1 border border-[#334155] py-3 rounded-lg font-bold text-sm text-[#94a3b8] hover:bg-[#1e293b]">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 py-3 text-sm">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

