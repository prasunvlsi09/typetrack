import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Keyboard, LayoutDashboard, FileText, BookOpen, MonitorPlay, Settings, User, Plus, Search, ChevronRight, BarChart2, Clock, Target, Zap, Bot } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { TopeLogo } from './TopeLogo';

// --- High-Fidelity Simulations ---

const TypingSimulation = () => {
  const [words] = useState("the quick brown fox jumps over the lazy dog".split(" "));
  const [typedIndex, setTypedIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTypedIndex(prev => (prev + 1) % (words.length + 1));
    }, 300);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className="w-full max-w-2xl bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center text-white/50 text-sm font-medium">
        <div className="flex gap-4 bg-black/20 px-4 py-2 rounded-xl">
          <span className="text-emerald-400">time</span>
          <span>words</span>
          <span>zen</span>
        </div>
        <div className="flex gap-4 bg-black/20 px-4 py-2 rounded-xl">
          <span>15</span>
          <span className="text-emerald-400">30</span>
          <span>60</span>
          <span>120</span>
        </div>
      </div>
      
      {/* Typing Area */}
      <div className="flex flex-wrap gap-x-3 gap-y-2 text-2xl sm:text-3xl font-mono justify-center text-center">
        {words.map((word, i) => (
          <span key={i} className={i < typedIndex ? "text-emerald-400" : i === typedIndex ? "text-white border-b-2 border-emerald-400" : "text-white/30"}>
            {word}
          </span>
        ))}
      </div>
      
      {/* Bottom Bar */}
      <div className="flex justify-center mt-4">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50">
          <SkipBack className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const DashboardSimulation = () => {
  return (
    <div className="w-full max-w-2xl bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
            <User className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-white font-bold text-lg">Guest User</div>
            <div className="text-white/50 text-sm">Joined today</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Zap, label: 'Highest WPM', val: '124', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { icon: Target, label: 'Avg Accuracy', val: '98%', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { icon: BarChart2, label: 'Tests Taken', val: '42', color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { icon: Clock, label: 'Time Typed', val: '2h 15m', color: 'text-purple-400', bg: 'bg-purple-400/10' }
        ].map((stat, i) => (
          <div key={i} className="bg-black/20 p-4 rounded-2xl flex flex-col gap-2 items-start">
            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="text-white/50 text-xs font-medium">{stat.label}</div>
            <div className="text-white font-bold text-xl">{stat.val}</div>
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="bg-black/20 p-4 rounded-2xl h-32 flex items-end gap-2 justify-between">
        {[40, 55, 45, 70, 65, 90, 85, 110, 95, 124].map((h, i) => (
          <motion.div 
            key={i} 
            initial={{height: 0}} 
            animate={{height: `${(h/124)*100}%`}} 
            transition={{duration: 0.5, delay: i * 0.05}}
            className="w-full bg-gradient-to-t from-purple-600/50 to-purple-400 rounded-t-sm" 
          />
        ))}
      </div>
    </div>
  );
};

const ChatSimulation = () => {
  return (
    <div className="w-full max-w-2xl bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl flex overflow-hidden h-[300px]">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-white/10 bg-black/20 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-white font-bold">
          <TopeLogo className="w-6 h-6" variant="tt2" />
          Tope AI
        </div>
        <div className="bg-amber-500/20 text-amber-400 text-xs py-2 px-3 rounded-lg border border-amber-500/30 flex items-center justify-between">
          <span className="truncate">How to improve accuracy?</span>
        </div>
        <div className="text-white/30 text-xs py-2 px-3 rounded-lg hover:bg-white/5 flex items-center justify-between">
          <span className="truncate">Analyze my last test</span>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="w-2/3 p-4 flex flex-col justify-between bg-black/10">
        <div className="flex flex-col gap-4">
          <motion.div 
            initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}}
            className="self-end bg-white/10 text-white p-3 rounded-2xl rounded-tr-sm text-sm max-w-[80%]"
          >
            How can I improve my accuracy?
          </motion.div>
          <motion.div 
            initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.8}}
            className="self-start flex gap-3 max-w-[90%]"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <TopeLogo className="w-5 h-5" variant="tt2" />
            </div>
            <div className="bg-black/30 text-white/90 p-3 rounded-2xl rounded-tl-sm text-sm border border-white/5">
              Try slowing down and focusing on the home row! I've analyzed your recent tests and noticed you struggle with the 'Y' and 'P' keys.
            </div>
          </motion.div>
        </div>
        
        {/* Input */}
        <div className="mt-4 bg-black/30 border border-white/10 rounded-xl p-3 flex items-center gap-2">
          <div className="flex-1 h-4 bg-white/10 rounded animate-pulse w-1/2"></div>
          <div className="w-6 h-6 bg-amber-500/50 rounded-full flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

const NotesSimulation = () => {
  return (
    <div className="w-full max-w-2xl bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="text-white font-bold text-xl">Notes</div>
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/50"><Search className="w-4 h-4" /></div>
          <div className="w-8 h-8 rounded-lg bg-pink-500 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{rotate: -2, scale: 0.9, opacity: 0}}
          animate={{rotate: 0, scale: 1, opacity: 1}}
          transition={{type: "spring"}}
          className="bg-pink-500/20 border border-pink-500/30 p-5 rounded-2xl text-left shadow-[0_0_20px_rgba(236,72,153,0.1)]"
        >
          <div className="font-bold text-pink-200 mb-3 text-lg">Goals for this week</div>
          <div className="text-pink-100/80 text-sm space-y-2">
            <div>• Reach 100 WPM</div>
            <div>• 98% Accuracy</div>
            <div>• Practice Dvorak layout</div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{rotate: 2, scale: 0.9, opacity: 0}}
          animate={{rotate: 0, scale: 1, opacity: 1}}
          transition={{type: "spring", delay: 0.1}}
          className="bg-blue-500/20 border border-blue-500/30 p-5 rounded-2xl text-left"
        >
          <div className="font-bold text-blue-200 mb-3 text-lg">Difficult Words</div>
          <div className="text-blue-100/80 text-sm space-y-2">
            <div>• rhythm</div>
            <div>• accommodate</div>
            <div>• embarrass</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const LessonsSimulation = () => {
  const [activeKey, setActiveKey] = useState(14);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveKey(Math.floor(Math.random() * 30));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const rows = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l',';'],
    ['z','x','c','v','b','n','m',',','.','/']
  ];

  return (
    <div className="w-full max-w-2xl bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl flex gap-6">
      {/* Sidebar */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
          <div className="text-white font-bold mb-3 text-sm">Keyboard Layout</div>
          <div className="space-y-2">
            <div className="bg-white/10 text-white text-xs py-2 px-3 rounded-lg border border-white/20 flex justify-between">
              <span>QWERTY</span><div className="w-2 h-2 rounded-full bg-emerald-400 mt-1" />
            </div>
            <div className="text-white/50 text-xs py-2 px-3 rounded-lg">Dvorak</div>
          </div>
        </div>
        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
          <div className="text-white font-bold mb-3 text-sm">Practice Mode</div>
          <div className="bg-cyan-500/20 text-cyan-400 text-xs py-2 px-3 rounded-lg border border-cyan-500/30 text-center font-bold">
            Home Row
          </div>
        </div>
      </div>
      
      {/* Keyboard Area */}
      <div className="w-2/3 bg-black/20 rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center gap-2">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1.5" style={{ marginLeft: `${rIdx * 12}px` }}>
            {row.map((key, kIdx) => {
              const index = rIdx * 10 + kIdx;
              const isActive = index === activeKey;
              return (
                <div 
                  key={key} 
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-mono font-bold uppercase transition-all duration-200 ${
                    isActive 
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-110 z-10' 
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  {key}
                </div>
              );
            })}
          </div>
        ))}
        <div className="w-48 h-8 mt-1 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/30 text-xs font-bold">
          SPACE
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const CHAPTERS = [
  {
    id: 'welcome',
    title: 'Welcome to TypeTrack',
    icon: MonitorPlay,
    description: 'Your ultimate typing companion. Let\'s take a quick interactive tour of all the features available to help you type faster and better.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30'
  },
  {
    id: 'test',
    title: 'The Typing Test',
    icon: Keyboard,
    description: 'The core experience. Choose between Words, Time, or Zen modes. Customize your difficulty, punctuation, and error modes to match your skill level.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30'
  },
  {
    id: 'dashboard',
    title: 'Dashboard & Records',
    icon: LayoutDashboard,
    description: 'Track your progress over time. View detailed analytics, recent sessions, and your personal bests to see how much you\'ve improved.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30'
  },
  {
    id: 'ai',
    title: 'Tope AI Assistant',
    icon: Bot,
    description: 'Meet Tope, your personal AI typing assistant. Ask for typing tips, analyze your stats, or get personalized advice on how to improve your accuracy.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30'
  },
  {
    id: 'notes',
    title: 'Personal Notes',
    icon: FileText,
    description: 'Keep track of your typing goals, custom word lists, or anything else you need to remember. Pin important notes to the top for easy access.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30'
  },
  {
    id: 'lessons',
    title: 'Interactive Lessons',
    icon: BookOpen,
    description: 'Master your keyboard layout. Practice specific rows, learn proper touch typing technique, and visualize finger placements for QWERTY, Dvorak, or Colemak.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30'
  }
];

const CHAPTER_DURATION = 8000; // 8 seconds per chapter

export function InteractiveVideo() {
  const { settings } = useAppContext();
  const isLight = settings.theme === 'light';
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [progress, setProgress] = useState(0);

  // Fix: Use requestAnimationFrame for smooth, reliable progress updates
  // that don't suffer from stale closures or race conditions.
  useEffect(() => {
    if (!isPlaying) return;

    let frame: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      setProgress(p => {
        const next = p + (delta / CHAPTER_DURATION) * 100;
        return next >= 100 ? 100 : next;
      });
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  // Fix: Handle chapter transitions safely in a separate effect
  useEffect(() => {
    if (progress >= 100 && isPlaying) {
      if (currentChapter < CHAPTERS.length - 1) {
        setCurrentChapter(c => c + 1);
        setProgress(0);
      } else {
        setIsPlaying(false);
      }
    }
  }, [progress, isPlaying, currentChapter]);

  const togglePlay = () => {
    if (progress >= 100 && currentChapter === CHAPTERS.length - 1) {
      // Restart if at the end
      setCurrentChapter(0);
      setProgress(0);
    }
    setIsPlaying(!isPlaying);
  };

  const goToChapter = (index: number) => {
    setCurrentChapter(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const skipForward = () => {
    if (currentChapter < CHAPTERS.length - 1) {
      setCurrentChapter(c => c + 1);
      setProgress(0);
    }
  };

  const skipBack = () => {
    if (progress > 10) {
      setProgress(0);
    } else if (currentChapter > 0) {
      setCurrentChapter(c => c - 1);
      setProgress(0);
    }
  };

  const chapter = CHAPTERS[currentChapter];
  const Icon = chapter.icon;

  return (
    <div className={`w-full rounded-3xl overflow-hidden border shadow-2xl flex flex-col ${isLight ? 'bg-white border-black/10' : 'bg-gray-900 border-white/10'}`}>
      {/* Video Screen Area */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center group min-h-[300px]">
        
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute inset-0 ${chapter.bg} transition-colors duration-1000`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-5xl px-8 h-full py-8"
          >
            {/* Left side: Text */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
              <motion.div 
                initial={{ rotate: -10, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6 border-2 shadow-2xl ${chapter.bg} ${chapter.color} ${chapter.border} backdrop-blur-xl`}
              >
                <Icon className="w-8 h-8 md:w-10 md:h-10" />
              </motion.div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                {chapter.title}
              </h2>
              
              <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-md">
                {chapter.description}
              </p>
            </div>

            {/* Right side: Simulation */}
            <div className="flex-1 flex items-center justify-center w-full">
              {chapter.id === 'welcome' && (
                 <MonitorPlay className={`w-32 h-32 ${chapter.color} opacity-50 animate-pulse`} />
              )}
              {chapter.id === 'test' && <TypingSimulation />}
              {chapter.id === 'dashboard' && <DashboardSimulation />}
              {chapter.id === 'ai' && <ChatSimulation />}
              {chapter.id === 'notes' && <NotesSimulation />}
              {chapter.id === 'lessons' && <LessonsSimulation />}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Big Play Button Overlay (when paused) */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={togglePlay}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm group-hover:bg-black/50 transition-colors"
            >
              <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md text-white hover:scale-110 hover:bg-white/20 transition-all">
                <Play className="w-8 h-8 ml-1" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Area */}
      <div className={`p-4 sm:p-6 flex flex-col gap-4 ${isLight ? 'bg-gray-50' : 'bg-gray-900'}`}>
        
        {/* Progress Bar */}
        <div className="flex gap-1 h-1.5 w-full">
          {CHAPTERS.map((chap, idx) => {
            let width = '0%';
            if (idx < currentChapter) width = '100%';
            else if (idx === currentChapter) width = `${progress}%`;

            return (
              <div 
                key={chap.id} 
                className={`flex-1 rounded-full cursor-pointer overflow-hidden ${isLight ? 'bg-black/10' : 'bg-white/10'}`}
                onClick={() => goToChapter(idx)}
              >
                <div 
                  className={`h-full rounded-full transition-all duration-75 ${chap.color.replace('text-', 'bg-')}`}
                  style={{ width }}
                />
              </div>
            );
          })}
        </div>

        {/* Controls & Chapters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={skipBack}
              className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-black/5 text-black/70' : 'hover:bg-white/10 text-white/70'}`}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={togglePlay}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${isLight ? 'bg-black text-white' : 'bg-white text-black'}`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
            <button 
              onClick={skipForward}
              className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-black/5 text-black/70' : 'hover:bg-white/10 text-white/70'}`}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Chapter Indicators */}
          <div className="flex flex-wrap justify-center gap-2">
            {CHAPTERS.map((chap, idx) => {
              const isActive = idx === currentChapter;
              const ChapIcon = chap.icon;
              return (
                <button
                  key={chap.id}
                  onClick={() => goToChapter(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? `${chap.bg} ${chap.color} border ${chap.border}` 
                      : isLight 
                        ? 'text-black/50 hover:bg-black/5 border border-transparent' 
                        : 'text-white/50 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <ChapIcon className="w-4 h-4" />
                  <span className="hidden md:inline">{chap.title}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
