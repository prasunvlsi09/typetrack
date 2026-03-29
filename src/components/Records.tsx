import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { GlassCard } from './GlassCard';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Plus, X } from 'lucide-react';
import MagneticEffect from './MagneticEffect';

export function Records() {
  const { records, addRecord, settings } = useAppContext();
  const isLight = settings.theme === 'light';
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [wpm, setWpm] = useState('');
  const [accuracy, setAccuracy] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !wpm || !accuracy) return;

    addRecord({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      title,
      wpm: Number(wpm),
      accuracy: Number(accuracy),
    });

    setTitle('');
    setWpm('');
    setAccuracy('');
    setIsAdding(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between mb-12">
        <div className="space-y-4">
          <h2 className={`text-5xl font-bold tracking-tight drop-shadow-lg ${isLight ? 'text-black' : 'text-white'}`}>Records</h2>
          <p className={`text-xl font-medium ${isLight ? 'text-black/80' : 'text-white/80'}`}>Track your achievements across platforms.</p>
        </div>
        <MagneticEffect>
          <button
            onClick={() => setIsAdding(true)}
            className={`flex items-center space-x-2 px-6 py-3 border rounded-full backdrop-blur-3xl backdrop-saturate-200 shadow-lg transition-all duration-300 font-semibold ${isLight ? 'bg-white/60 hover:bg-white/80 border-white/50 text-black' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
          >
            <Plus className="w-5 h-5" />
            <span>Set Record</span>
          </button>
        </MagneticEffect>
      </div>

      {isAdding && (
        <GlassCard className="relative mb-8">
          <button 
            onClick={() => setIsAdding(false)}
            className={`absolute top-4 right-4 transition-colors ${isLight ? 'text-black/50 hover:text-black' : 'text-white/50 hover:text-white'}`}
          >
            <X className="w-6 h-6" />
          </button>
          <h3 className={`text-2xl font-semibold mb-6 ${isLight ? 'text-black' : 'text-white'}`}>Add New Record</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className={`text-sm font-medium uppercase tracking-wider ${isLight ? 'text-black/70' : 'text-white/70'}`}>Website / Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${isLight ? 'bg-black/5 border-black/10 text-black placeholder-black/30 focus:ring-black/50' : 'bg-black/20 border-white/10 text-white placeholder-white/30 focus:ring-white/50'}`}
                  placeholder="e.g., Monkeytype"
                  required
                />
              </div>
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
                Save Record
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {records.length === 0 ? (
          <div className={`col-span-full text-center py-12 ${isLight ? 'text-black/50' : 'text-white/50'}`}>
            No records added yet. Click "Set Record" to add one.
          </div>
        ) : (
          records.map((record) => (
            <GlassCard key={record.id} className={`flex flex-col space-y-4 transition-colors ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/15'}`}>
              <div className="flex justify-between items-start">
                <h4 className={`text-2xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>{record.title}</h4>
                <span className={`text-sm font-medium ${isLight ? 'text-black/50' : 'text-white/50'}`}>{format(new Date(record.date), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex space-x-8">
                <div>
                  <div className="text-3xl font-black text-emerald-400">{record.wpm}</div>
                  <div className={`text-xs uppercase tracking-widest font-semibold ${isLight ? 'text-black/50' : 'text-white/50'}`}>WPM</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-blue-400">{record.accuracy}%</div>
                  <div className={`text-xs uppercase tracking-widest font-semibold ${isLight ? 'text-black/50' : 'text-white/50'}`}>Accuracy</div>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </motion.div>
  );
}
