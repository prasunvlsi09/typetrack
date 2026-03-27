import { useAppContext } from '../context/AppContext';
import { GlassCard } from './GlassCard';
import { Play, Activity, Trophy, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export function Home() {
  const { setView, sessions, settings } = useAppContext();
  const isLight = settings.theme === 'light';

  const totalSessions = sessions.length;
  const averageWpm = totalSessions ? Math.round(sessions.reduce((acc, s) => acc + s.wpm, 0) / totalSessions) : 0;
  const bestWpm = totalSessions ? Math.max(...sessions.map(s => s.wpm)) : 0;
  const averageAccuracy = totalSessions ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / totalSessions) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center space-y-4">
        <h1 className={`text-6xl font-bold tracking-tight drop-shadow-lg ${isLight ? 'text-black' : 'text-white'}`}>TypeTrack</h1>
        <p className={`text-xl font-medium ${isLight ? 'text-black/80' : 'text-white/80'}`}>Track and type, master it with TypeTrack.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className={`flex flex-col items-center justify-center p-8 space-y-2 transition-colors ${isLight ? 'hover:bg-black/10' : 'hover:bg-white/20'}`}>
          <Activity className="w-8 h-8 text-emerald-500 mb-2" />
          <span className={`text-4xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>{averageWpm}</span>
          <span className={`text-sm uppercase tracking-wider font-semibold ${isLight ? 'text-black/60' : 'text-white/60'}`}>Avg WPM</span>
        </GlassCard>
        
        <GlassCard className={`flex flex-col items-center justify-center p-8 space-y-2 transition-colors ${isLight ? 'hover:bg-black/10' : 'hover:bg-white/20'}`}>
          <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
          <span className={`text-4xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>{bestWpm}</span>
          <span className={`text-sm uppercase tracking-wider font-semibold ${isLight ? 'text-black/60' : 'text-white/60'}`}>Best WPM</span>
        </GlassCard>

        <GlassCard className={`flex flex-col items-center justify-center p-8 space-y-2 transition-colors ${isLight ? 'hover:bg-black/10' : 'hover:bg-white/20'}`}>
          <Clock className="w-8 h-8 text-blue-500 mb-2" />
          <span className={`text-4xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>{averageAccuracy}%</span>
          <span className={`text-sm uppercase tracking-wider font-semibold ${isLight ? 'text-black/60' : 'text-white/60'}`}>Avg Accuracy</span>
        </GlassCard>

        <GlassCard className={`flex flex-col items-center justify-center p-8 space-y-2 transition-colors ${isLight ? 'hover:bg-black/10' : 'hover:bg-white/20'}`}>
          <Play className="w-8 h-8 text-purple-500 mb-2" />
          <span className={`text-4xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>{totalSessions}</span>
          <span className={`text-sm uppercase tracking-wider font-semibold ${isLight ? 'text-black/60' : 'text-white/60'}`}>Sessions</span>
        </GlassCard>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={() => setView('test')}
          className={`group relative px-8 py-4 border rounded-full backdrop-blur-md transition-all duration-300 flex items-center space-x-3 ${isLight ? 'bg-black/5 hover:bg-black/10 border-black/20 shadow-[0_0_40px_rgba(0,0,0,0.05)] hover:shadow-[0_0_60px_rgba(0,0,0,0.1)]' : 'bg-white/10 hover:bg-white/20 border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]'}`}
        >
          <span className={`text-xl font-semibold ${isLight ? 'text-black' : 'text-white'}`}>Start Typing Test</span>
          <Play className={`w-6 h-6 group-hover:translate-x-1 transition-transform ${isLight ? 'text-black' : 'text-white'}`} />
        </button>
      </div>
    </motion.div>
  );
}
