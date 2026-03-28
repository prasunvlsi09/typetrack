import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { GlassCard } from './GlassCard';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { format } from 'date-fns';
import { Plus, X } from 'lucide-react';
import MagneticEffect from './MagneticEffect';

export function Dashboard() {
  const { sessions, addSession, clearSessions, settings, user } = useAppContext();
  const isLight = settings.theme === 'light';
  const isDev = user?.displayName?.endsWith('.dev') || user?.displayName?.endsWith('.admin');
  const [isAdding, setIsAdding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [wpm, setWpm] = useState('');
  const [accuracy, setAccuracy] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpm || !accuracy) return;

    addSession({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      wpm: Number(wpm),
      accuracy: Number(accuracy),
      settings: {
        punctuation: 'none',
        wordCount: 0,
        wordDifficulty: 'basic',
        capitalLetters: false,
      }
    });

    setWpm('');
    setAccuracy('');
    setIsAdding(false);
  };

  const chartData = sessions.map((s, index) => ({
    ...s,
    index: index + 1,
    dateFormatted: format(new Date(s.date), 'MMM dd, HH:mm')
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="space-y-4 text-center md:text-left">
          <h2 className={`text-5xl font-bold tracking-tight drop-shadow-lg ${isLight ? 'text-black' : 'text-white'}`}>Dashboard</h2>
          <p className={`text-xl font-medium ${isLight ? 'text-black/80' : 'text-white/80'}`}>Visualize your typing journey.</p>
        </div>
        <div className="flex items-center space-x-4">
          {isDev && (
            <MagneticEffect>
              <button
                onClick={() => setIsClearing(true)}
                className={`flex items-center justify-center space-x-2 px-6 py-3 border rounded-full backdrop-blur-2xl backdrop-saturate-200 shadow-lg transition-all duration-300 font-semibold ${isLight ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-600' : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-400'}`}
                title="Developer Only Feature"
              >
                <X className="w-5 h-5" />
                <span>Clear Data</span>
              </button>
            </MagneticEffect>
          )}
          <MagneticEffect>
            <button
              onClick={() => setIsAdding(true)}
              className={`flex items-center justify-center space-x-2 px-6 py-3 border rounded-full backdrop-blur-2xl backdrop-saturate-200 shadow-lg transition-all duration-300 font-semibold ${isLight ? 'bg-white/40 hover:bg-white/60 border-white/50 text-black' : 'bg-black/40 hover:bg-black/60 border-white/10 text-white'}`}
            >
              <Plus className="w-5 h-5" />
              <span>Set Session</span>
            </button>
          </MagneticEffect>
        </div>
      </div>

      {isClearing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md relative">
            <h3 className={`text-2xl font-semibold mb-4 ${isLight ? 'text-black' : 'text-white'}`}>Clear All Data?</h3>
            <p className={`mb-8 ${isLight ? 'text-black/70' : 'text-white/70'}`}>Are you sure you want to clear all your typing sessions? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsClearing(false)}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${isLight ? 'bg-black/10 hover:bg-black/20 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearSessions();
                  setIsClearing(false);
                }}
                className="px-6 py-2 rounded-full font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/30"
              >
                Clear Data
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {isAdding && (
        <GlassCard className="relative mb-8">
          <button 
            onClick={() => setIsAdding(false)}
            className={`absolute top-4 right-4 transition-colors ${isLight ? 'text-black/50 hover:text-black' : 'text-white/50 hover:text-white'}`}
          >
            <X className="w-6 h-6" />
          </button>
          <h3 className={`text-2xl font-semibold mb-6 ${isLight ? 'text-black' : 'text-white'}`}>Add Manual Session</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`text-sm font-medium uppercase tracking-wider ${isLight ? 'text-black/70' : 'text-white/70'}`}>WPM</label>
                <input
                  type="number"
                  value={wpm}
                  onChange={(e) => setWpm(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${isLight ? 'bg-black/5 border-black/10 text-black placeholder-black/30 focus:ring-black/50' : 'bg-black/20 border-white/10 text-white placeholder-white/30 focus:ring-white/50'}`}
                  placeholder="120"
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className={`text-sm font-medium uppercase tracking-wider ${isLight ? 'text-black/70' : 'text-white/70'}`}>Accuracy (%)</label>
                <input
                  type="number"
                  value={accuracy}
                  onChange={(e) => setAccuracy(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${isLight ? 'bg-black/5 border-black/10 text-black placeholder-black/30 focus:ring-black/50' : 'bg-black/20 border-white/10 text-white placeholder-white/30 focus:ring-white/50'}`}
                  placeholder="98"
                  required
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 shadow-lg ${isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'}`}
              >
                Save Session
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="h-[400px] flex flex-col">
          <h3 className={`text-2xl font-semibold mb-6 ${isLight ? 'text-black' : 'text-white'}`}>WPM Progression (Line Plot)</h3>
          <div className="flex-1 w-full h-full">
            {sessions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"} />
                  <XAxis dataKey="index" stroke={isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"} />
                  <YAxis stroke={isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)', border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: isLight ? 'black' : 'white' }}
                    labelStyle={{ color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}
                  />
                  <Line type="monotone" dataKey="wpm" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex items-center justify-center h-full ${isLight ? 'text-black/50' : 'text-white/50'}`}>No sessions yet.</div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="h-[400px] flex flex-col">
          <h3 className={`text-2xl font-semibold mb-6 ${isLight ? 'text-black' : 'text-white'}`}>Accuracy vs WPM (Dot Plot)</h3>
          <div className="flex-1 w-full h-full">
            {sessions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"} />
                  <XAxis type="number" dataKey="wpm" name="WPM" stroke={isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"} domain={['dataMin - 10', 'dataMax + 10']} />
                  <YAxis type="number" dataKey="accuracy" name="Accuracy" unit="%" stroke={isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"} domain={[0, 100]} />
                  <ZAxis type="number" range={[100, 100]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)', border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: isLight ? 'black' : 'white' }}
                  />
                  <Scatter name="Sessions" data={chartData} fill="#10b981" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className={`flex items-center justify-center h-full ${isLight ? 'text-black/50' : 'text-white/50'}`}>No sessions yet.</div>
            )}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
