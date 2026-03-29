import { AppProvider, useAppContext } from './context/AppContext';
import { Home } from './components/Home';
import { TypingTest } from './components/TypingTest';
import { Dashboard } from './components/Dashboard';
import { Records } from './components/Records';
import { TopeAI } from './components/TopeAI';
import { Notes } from './components/Notes';
import { TopeSidebar } from './components/TopeSidebar';
import { TopeLogo } from './components/TopeLogo';
import { Lessons } from './components/Lessons';
import { AuthModal } from './components/AuthModal';
import { AccLogsModal } from './components/AccLogsModal';
import { PanelModal } from './components/PanelModal';
import { ProfileModal } from './components/ProfileModal';
import { LocalMailModal } from './components/LocalMailModal';
import { Keyboard, LayoutDashboard, Trophy, Home as HomeIcon, LogIn, LogOut, Moon, Sun, Bot, Users, Mail, FileText, Shield, X, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { logOut, db } from './firebase';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { Logo } from './components/Logo';
import MagneticEffect from './components/MagneticEffect';

function DevSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="10" x2="90" y2="90" />
      <line x1="10" y1="90" x2="90" y2="10" />
      <path d="M 10 90 C 10 40, 40 10, 90 10" />
    </svg>
  );
}

function GlobalMessage() {
  const [message, setMessage] = useState<{text: string, id: number, senderEmail?: string} | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'broadcast'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Only show if the message is less than 1 minute old to prevent showing old messages on load
        if (data.timestamp && Date.now() - data.timestamp < 60000 && data.message) {
          setMessage({ text: data.message, id: data.timestamp, senderEmail: data.senderEmail });
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  let senderName = "System Broadcast";
  let isDev = false;
  if (message?.senderEmail === 'eptoflprat@typetrack.local') { senderName = "expertPrat.owner"; isDev = true; }
  else if (message?.senderEmail === 'pratyusalt@typetrack.local') { senderName = "PratAlt.owner"; isDev = true; }
  else if (message?.senderEmail === 'rajarin@typetrack.local') { senderName = "expertAJ.owner"; isDev = true; }
  else if (message?.senderEmail === 'pratyus@typetrack.local') { senderName = "pratyus.owner"; isDev = true; }
  else if (message?.senderEmail === 'prasun.ece07@gmail.com') { senderName = "prasun.owner"; isDev = true; }

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4"
        >
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-2xl border border-blue-400/30 flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-blue-100 text-sm uppercase tracking-wider">{senderName}</h4>
                {isDev && <DevSign className="w-4 h-4 text-blue-200" />}
              </div>
              <p className="text-base font-medium">{message.text}</p>
            </div>
            <button 
              onClick={() => setMessage(null)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Header() {
  const { user, userRole, authLoading, settings, updateSettings, systemStatus } = useAppContext();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccLogsOpen, setIsAccLogsOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLocalMailOpen, setIsLocalMailOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'devlog' | 'devsignup' | 'dev_select'>('login');
  const [unreadMailCount, setUnreadMailCount] = useState(0);

  useEffect(() => {
    if (!user || !user.email) return;

    const q = query(
      collection(db, 'mail'),
      where('recipientEmail', '==', user.email),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadMailCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [user]);

  const openLogin = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const isDev = userRole === 'dev' || userRole === 'admin' || user?.displayName?.endsWith('.dev') || user?.displayName?.endsWith('.admin') || user?.email === 'prasun.ece07@gmail.com';
  const isAdmin = 
    userRole === 'admin' ||
    (user?.displayName?.endsWith('.admin') && user?.email?.endsWith('@typetrack.local')) || 
    user?.email === 'rajarin@typetrack.local' || 
    user?.email === 'pratyus@typetrack.local' || 
    user?.email === 'pratyusalt@typetrack.local' ||
    user?.email === 'prasun.ece07@gmail.com';
  const hasPanelAccess = 
    user?.email === 'eptoflprat@typetrack.local' || 
    user?.email === 'rajarin@typetrack.local' || 
    user?.email === 'pratyusalt@typetrack.local' ||
    user?.email === 'pratyus@typetrack.local' ||
    user?.email === 'prasun.ece07@gmail.com';
  const isLight = settings.theme === 'light';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Logo className="w-12 h-12" />
            <div className="flex items-center gap-3">
              <h1 className={`text-2xl font-bold tracking-tighter ${isLight ? 'text-black' : 'text-white'}`}>TypeTrack</h1>
              <div className="flex items-center gap-2">
                {systemStatus.server !== 'Online' && (
                  <div className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                    systemStatus.server === 'Updating' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {systemStatus.server}
                  </div>
                )}
                {systemStatus.database === 'Disconnected' && (
                  <div className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-red-500 text-white">
                    DB Offline
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {user && (
            <MagneticEffect>
              <button
                onClick={() => setIsLocalMailOpen(true)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 font-semibold text-sm relative ${
                  isLight 
                    ? 'bg-black/5 text-black hover:bg-black/10 border border-black/10' 
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Local</span>
                {unreadMailCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    {unreadMailCount}
                  </span>
                )}
              </button>
            </MagneticEffect>
          )}
        </div>
        
        {!authLoading && (
          <div className="flex items-center space-x-4">
            {user ? (
              <div className={`flex items-center space-x-4 ${isLight ? 'bg-white/60 border-white/50 shadow-lg' : 'bg-white/5 border-white/10 shadow-lg'} backdrop-blur-3xl backdrop-saturate-200 border rounded-full pl-2 pr-4 py-1.5`}>
                {isAdmin && (
                  <MagneticEffect>
                    <button
                      onClick={() => setIsAccLogsOpen(true)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors font-bold text-sm ${isLight ? 'bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                      title="Account Logs"
                    >
                      <Users className="w-4 h-4" />
                      <span>Acc Logs</span>
                    </button>
                  </MagneticEffect>
                )}
                {hasPanelAccess && (
                  <MagneticEffect>
                    <button
                      onClick={() => setIsPanelOpen(true)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-colors font-bold text-sm ${isLight ? 'bg-red-500/20 text-red-700 hover:bg-red-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                      title="Admin Panel"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Panel</span>
                    </button>
                  </MagneticEffect>
                )}
                {isDev && (
                  <MagneticEffect>
                    <button
                      onClick={() => updateSettings({ theme: isLight ? 'dark' : 'light' })}
                      className={`p-1.5 rounded-full transition-colors ${isLight ? 'text-black/70 hover:text-black hover:bg-black/10' : 'text-white/70 hover:text-white hover:bg-white/20'}`}
                      title="Toggle Theme (Dev Only)"
                    >
                      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                  </MagneticEffect>
                )}
                
                <MagneticEffect>
                  <button 
                    onClick={() => setIsProfileOpen(true)}
                    className={`flex items-center space-x-3 hover:opacity-80 transition-opacity`}
                    title="Profile Settings"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className={`text-sm font-medium hidden md:block ${isLight ? 'text-black/90' : 'text-white/90'}`}>
                      Hello, {user.displayName || user.email?.split('@')[0]}
                    </span>
                  </button>
                </MagneticEffect>

                <MagneticEffect>
                  <button 
                    onClick={logOut}
                    className={`p-1.5 rounded-full transition-colors ${isLight ? 'text-black/70 hover:text-black hover:bg-black/10' : 'text-white/70 hover:text-white hover:bg-white/20'}`}
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </MagneticEffect>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setAuthMode('dev_select');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                  Dev Mode
                </button>
                <button
                  onClick={openLogin}
                  className="px-4 py-2 text-white/70 hover:text-white font-semibold transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={openSignUp}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-500 text-white hover:bg-emerald-400 rounded-full font-bold transition-all duration-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />
      <AccLogsModal
        isOpen={isAccLogsOpen}
        onClose={() => setIsAccLogsOpen(false)}
      />
      <PanelModal
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <LocalMailModal
        isOpen={isLocalMailOpen}
        onClose={() => setIsLocalMailOpen(false)}
      />
    </>
  );
}

function Navigation() {
  const { view, setView, settings, user } = useAppContext();
  const [isVisible, setIsVisible] = useState(true);
  const isLight = settings.theme === 'light';
  const isDev = user?.displayName?.endsWith('.dev') || user?.displayName?.endsWith('.admin');

  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'test', icon: Keyboard, label: 'Test' },
    { id: 'lessons', icon: BookOpen, label: 'Lessons' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'records', icon: Trophy, label: 'Records' },
    { id: 'notes', icon: FileText, label: 'Notes' },
    { id: 'tope', icon: TopeLogo, label: 'Tope AI' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <AnimatePresence>
        {isVisible && (
          <motion.nav 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-3"
          >
            <div className={`flex items-center space-x-2 ${isLight ? 'bg-white/60 border-white/50 shadow-lg' : 'bg-white/5 border-white/10 shadow-lg'} backdrop-blur-3xl backdrop-saturate-200 border p-2 rounded-full`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = view === item.id;
                return (
                  <MagneticEffect key={item.id}>
                    <button
                      onClick={() => setView(item.id)}
                      className={`
                        relative px-6 py-3 rounded-full flex items-center space-x-2 transition-all duration-300
                        ${isActive 
                          ? (isLight ? 'text-white bg-black shadow-lg' : 'text-black bg-white shadow-lg') 
                          : (isLight ? 'text-black/70 hover:text-black hover:bg-black/10' : 'text-white/70 hover:text-white hover:bg-white/10')}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold hidden sm:inline">{item.label}</span>
                    </button>
                  </MagneticEffect>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`p-1.5 rounded-full transition-all duration-300 opacity-50 hover:opacity-100 ${isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20'} backdrop-blur-md`}
        title={isVisible ? "Hide Navigation" : "Show Navigation"}
      >
        {isVisible ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
    </div>
  );
}

function MainContent() {
  const { view } = useAppContext();

  return (
    <main className="pt-20 pb-20 px-6 min-h-screen">
      <AnimatePresence mode="wait">
        {view === 'home' && <Home key="home" />}
        {view === 'test' && <TypingTest key="test" />}
        {view === 'lessons' && <Lessons key="lessons" />}
        {view === 'dashboard' && <Dashboard key="dashboard" />}
        {view === 'records' && <Records key="records" />}
        {view === 'notes' && <Notes key="notes" />}
        {view === 'tope' && <TopeAI key="tope" />}
      </AnimatePresence>
    </main>
  );
}

function AppLayout() {
  const { settings, isTopeSidebarOpen, setIsTopeSidebarOpen, user } = useAppContext();
  const isLight = settings.theme === 'light';

  return (
    <div className={`min-h-screen ${isLight ? 'bg-white text-black selection:bg-emerald-400/30 selection:text-emerald-800' : 'bg-[#0a0a0a] text-white selection:bg-emerald-400/30 selection:text-emerald-200'} font-sans overflow-x-hidden transition-colors duration-300`}>
      {/* Liquid Glass Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full ${isLight ? 'bg-purple-300/40' : 'bg-purple-600/30'} blur-[120px] mix-blend-screen`} />
        <div className={`absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full ${isLight ? 'bg-blue-300/30' : 'bg-blue-600/20'} blur-[120px] mix-blend-screen`} />
        <div className={`absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full ${isLight ? 'bg-emerald-300/30' : 'bg-emerald-600/20'} blur-[120px] mix-blend-screen`} />
      </div>

      <div className="relative z-10">
        <GlobalMessage />
        <Header />
        <Navigation />
        <MainContent />
        {user && <TopeSidebar />}
        
        {/* Global Tope Limn Toggle Button */}
        {!isTopeSidebarOpen && user && (
          <button
            onClick={() => setIsTopeSidebarOpen(true)}
            className={`fixed bottom-24 right-6 z-40 p-4 rounded-full shadow-2xl transition-transform hover:scale-110 ${isLight ? 'bg-white text-emerald-600 border border-black/10' : 'bg-gray-800 text-emerald-400 border border-white/10'}`}
            title="Open Tope Limn 2.0"
          >
            <TopeLogo className="w-6 h-6" variant="tt2" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

