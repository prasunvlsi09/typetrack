import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { GlassCard } from './GlassCard';
import { BookOpen, CheckCircle2, Keyboard as KeyboardIcon, Info, Target, PlayCircle } from 'lucide-react';
import MagneticEffect from './MagneticEffect';
import { InteractiveVideo } from './InteractiveVideo';

type LayoutType = 'QWERTY' | 'Dvorak' | 'Colemak';
type TechniqueType = 'Touch Typing' | 'Hunt & Peck' | 'Hybrid';

const KEYBOARD_LAYOUTS = {
  QWERTY: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
  ],
  Dvorak: [
    ["'", ',', '.', 'p', 'y', 'f', 'g', 'c', 'r', 'l', '/', '='],
    ['a', 'o', 'e', 'u', 'i', 'd', 'h', 't', 'n', 's', '-'],
    [';', 'q', 'j', 'k', 'x', 'b', 'm', 'w', 'v', 'z']
  ],
  Colemak: [
    ['q', 'w', 'f', 'p', 'g', 'j', 'l', 'u', 'y', ';', '[', ']'],
    ['a', 'r', 's', 't', 'd', 'h', 'n', 'e', 'i', 'o', "'"],
    ['z', 'x', 'c', 'v', 'b', 'k', 'm', ',', '.', '/']
  ]
};

// 1: Left Pinky, 2: Left Ring, 3: Left Middle, 4: Left Index
// 5: Right Index, 6: Right Middle, 7: Right Ring, 8: Right Pinky
const FINGER_MAPPING: Record<string, Record<string, number>> = {
  QWERTY: {
    'q': 1, 'a': 1, 'z': 1,
    'w': 2, 's': 2, 'x': 2,
    'e': 3, 'd': 3, 'c': 3,
    'r': 4, 'f': 4, 'v': 4, 't': 4, 'g': 4, 'b': 4,
    'y': 5, 'h': 5, 'n': 5, 'u': 5, 'j': 5, 'm': 5,
    'i': 6, 'k': 6, ',': 6,
    'o': 7, 'l': 7, '.': 7,
    'p': 8, ';': 8, '/': 8, '[': 8, ']': 8, "'": 8, '-': 8, '=': 8
  },
  Dvorak: {
    '\'': 1, 'a': 1, ';': 1,
    ',': 2, 'o': 2, 'q': 2,
    '.': 3, 'e': 3, 'j': 3,
    'p': 4, 'u': 4, 'k': 4, 'y': 4, 'i': 4, 'x': 4,
    'f': 5, 'd': 5, 'b': 5, 'g': 5, 'h': 5, 'm': 5,
    'c': 6, 't': 6, 'w': 6,
    'r': 7, 'n': 7, 'v': 7,
    'l': 8, 's': 8, 'z': 8, '/': 8, '-': 8, '=': 8
  },
  Colemak: {
    'q': 1, 'a': 1, 'z': 1,
    'w': 2, 'r': 2, 'x': 2,
    'f': 3, 's': 3, 'c': 3,
    'p': 4, 't': 4, 'v': 4, 'g': 4, 'd': 4, 'b': 4,
    'j': 5, 'h': 5, 'k': 5, 'l': 5, 'n': 5, 'm': 5,
    'u': 6, 'e': 6, ',': 6,
    'y': 7, 'i': 7, '.': 7,
    ';': 8, 'o': 8, '/': 8, '[': 8, ']': 8, "'": 8, '-': 8, '=': 8
  }
};

const FINGER_COLORS = {
  1: 'bg-pink-500/20 text-pink-500 border-pink-500/30', // Left Pinky
  2: 'bg-purple-500/20 text-purple-500 border-purple-500/30', // Left Ring
  3: 'bg-blue-500/20 text-blue-500 border-blue-500/30', // Left Middle
  4: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30', // Left Index
  5: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30', // Right Index
  6: 'bg-blue-500/20 text-blue-500 border-blue-500/30', // Right Middle
  7: 'bg-purple-500/20 text-purple-500 border-purple-500/30', // Right Ring
  8: 'bg-pink-500/20 text-pink-500 border-pink-500/30', // Right Pinky
};

const TOP_ROWS: Record<LayoutType, string[]> = {
  QWERTY: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  Dvorak: ["'", ',', '.', 'p', 'y', 'f', 'g', 'c', 'r', 'l'],
  Colemak: ['q', 'w', 'f', 'p', 'g', 'j', 'l', 'u', 'y', ';']
};

const HOME_ROWS: Record<LayoutType, string[]> = {
  QWERTY: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
  Dvorak: ['a', 'o', 'e', 'u', 'h', 't', 'n', 's'],
  Colemak: ['a', 'r', 's', 't', 'n', 'e', 'i', 'o']
};

const BOTTOM_ROWS: Record<LayoutType, string[]> = {
  QWERTY: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  Dvorak: [';', 'q', 'j', 'k', 'x', 'b', 'm', 'w', 'v', 'z'],
  Colemak: ['z', 'x', 'c', 'v', 'b', 'k', 'm', ',', '.', '/']
};

const getFingerForTechnique = (baseFinger: number, technique: TechniqueType) => {
  if (technique === 'Touch Typing') return baseFinger;
  if (technique === 'Hunt & Peck') {
    return baseFinger <= 4 ? 4 : 5; // Left index (4) for left side, Right index (5) for right side
  }
  if (technique === 'Hybrid') {
    // Left hand: pinky/ring -> middle (3), middle/index -> index (4)
    if (baseFinger <= 2) return 3;
    if (baseFinger <= 4) return 4;
    // Right hand: index/middle -> index (5), ring/pinky -> middle (6)
    if (baseFinger <= 6) return 5;
    return 6;
  }
  return baseFinger;
};

export function Lessons() {
  const { settings } = useAppContext();
  const isLight = settings.theme === 'light';
  const [layout, setLayout] = useState<LayoutType>('QWERTY');
  const [technique, setTechnique] = useState<TechniqueType>('Touch Typing');

  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceRow, setPracticeRow] = useState<'top' | 'home' | 'bottom'>('home');
  const [practiceSequence, setPracticeSequence] = useState<string[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceHits, setPracticeHits] = useState(0);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const practiceTarget = 3;

  const startPractice = (row: 'top' | 'home' | 'bottom') => {
    setPracticeRow(row);
    if (row === 'top') setPracticeSequence(TOP_ROWS[layout]);
    else if (row === 'bottom') setPracticeSequence(BOTTOM_ROWS[layout]);
    else setPracticeSequence(HOME_ROWS[layout]);
    
    setPracticeIndex(0);
    setPracticeHits(0);
    setPracticeComplete(false);
    setIsPracticing(true);
  };

  const stopPractice = () => {
    setIsPracticing(false);
    setPracticeComplete(false);
  };

  useEffect(() => {
    if (!isPracticing || practiceComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetKey = practiceSequence[practiceIndex];
      if (!targetKey) return;

      if (e.key.toLowerCase() === targetKey.toLowerCase()) {
        e.preventDefault();
        if (practiceHits + 1 >= practiceTarget) {
          if (practiceIndex + 1 >= practiceSequence.length) {
            setPracticeComplete(true);
          } else {
            setPracticeIndex(i => i + 1);
            setPracticeHits(0);
          }
        } else {
          setPracticeHits(h => h + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPracticing, practiceComplete, practiceSequence, practiceIndex, practiceHits]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold mb-2 ${isLight ? 'text-black' : 'text-white'}`}>Typing Lessons</h1>
          <p className={`text-lg ${isLight ? 'text-black/60' : 'text-white/60'}`}>Master your keyboard layout and typing techniques.</p>
        </div>
        <BookOpen className={`w-12 h-12 ${isLight ? 'text-black/20' : 'text-white/20'}`} />
      </div>

      <GlassCard className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <PlayCircle className={`w-8 h-8 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          <h2 className={`text-2xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>App Tour</h2>
        </div>
        <p className={`text-lg mb-6 ${isLight ? 'text-black/70' : 'text-white/70'}`}>
          New to TypeTrack? Watch this interactive guide to learn how to use all the features and sections of the application.
        </p>
        <InteractiveVideo />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="space-y-6">
          <GlassCard className="space-y-4">
            <h2 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-black' : 'text-white'}`}>
              <KeyboardIcon className="w-5 h-5" />
              <span>Keyboard Layout</span>
            </h2>
            <div className="space-y-2">
              {(['QWERTY', 'Dvorak', 'Colemak'] as LayoutType[]).map((l) => (
                <MagneticEffect key={l}>
                  <button
                    onClick={() => setLayout(l)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      layout === l
                        ? (isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white')
                        : (isLight ? 'bg-white/40 border-black/10 text-black hover:bg-black/5' : 'bg-black/40 border-white/10 text-white hover:bg-white/5')
                    }`}
                  >
                    <span className="font-semibold">{l}</span>
                    {layout === l && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                </MagneticEffect>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <h2 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-black' : 'text-white'}`}>
              <Info className="w-5 h-5" />
              <span>Techniques</span>
            </h2>
            <div className="space-y-2">
              {(['Touch Typing', 'Hunt & Peck', 'Hybrid'] as TechniqueType[]).map((t) => (
                <MagneticEffect key={t}>
                  <button
                    onClick={() => setTechnique(t)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      technique === t
                        ? (isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white')
                        : (isLight ? 'bg-white/40 border-black/10 text-black hover:bg-black/5' : 'bg-black/40 border-white/10 text-white hover:bg-white/5')
                    }`}
                  >
                    <span className="font-semibold">{t}</span>
                    {technique === t && <CheckCircle2 className="w-5 h-5" />}
                  </button>
                </MagneticEffect>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <h2 className={`text-xl font-bold flex items-center space-x-2 ${isLight ? 'text-black' : 'text-white'}`}>
              <Target className="w-5 h-5" />
              <span>Practice Mode</span>
            </h2>
            <div className="space-y-2">
              {isPracticing ? (
                <MagneticEffect key="stop-practice">
                  <button
                    onClick={stopPractice}
                    className="w-full flex items-center justify-center p-4 rounded-2xl border transition-all font-bold bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30"
                  >
                    Stop Practice
                  </button>
                </MagneticEffect>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  <MagneticEffect key="top-row">
                    <button
                      onClick={() => startPractice('top')}
                      className="w-full flex items-center justify-center p-3 rounded-2xl border transition-all font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                    >
                      Top Row
                    </button>
                  </MagneticEffect>
                  <MagneticEffect key="home-row">
                    <button
                      onClick={() => startPractice('home')}
                      className="w-full flex items-center justify-center p-3 rounded-2xl border transition-all font-bold bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/30"
                    >
                      Home Row
                    </button>
                  </MagneticEffect>
                  <MagneticEffect key="bottom-row">
                    <button
                      onClick={() => startPractice('bottom')}
                      className="w-full flex items-center justify-center p-3 rounded-2xl border transition-all font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                    >
                      Bottom Row
                    </button>
                  </MagneticEffect>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Visualizer & Info */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="flex flex-col items-center justify-center p-8 min-h-[400px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {isPracticing && !practiceComplete && (
                <motion.div
                  key="practice-prompt"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md"
                >
                  <div className={`p-4 rounded-2xl border text-center shadow-lg ${isLight ? 'bg-white/80 border-black/10' : 'bg-black/60 border-white/10'} backdrop-blur-xl`}>
                    <h3 className={`text-lg font-bold mb-2 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>Interactive Practice</h3>
                    <p className={`text-xl ${isLight ? 'text-black' : 'text-white'}`}>
                      Press the <span className="font-mono font-bold text-3xl mx-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">{practiceSequence[practiceIndex]?.toUpperCase()}</span> key
                    </p>
                    <p className={`text-sm mt-2 font-medium ${isLight ? 'text-black/60' : 'text-white/60'}`}>
                      {practiceTarget - practiceHits} more time{(practiceTarget - practiceHits) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </motion.div>
              )}

              {practiceComplete && (
                <motion.div
                  key="practice-complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl"
                >
                  <div className={`p-8 rounded-3xl border text-center shadow-2xl max-w-sm w-full mx-4 ${isLight ? 'bg-white border-black/10' : 'bg-gray-900 border-white/10'}`}>
                    <div className="w-20 h-20 mx-auto bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isLight ? 'text-black' : 'text-white'}`}>Practice Complete!</h3>
                    <p className={`mb-8 ${isLight ? 'text-black/60' : 'text-white/60'}`}>You've successfully practiced the {practiceRow} row for the {layout} layout.</p>
                    <MagneticEffect key="continue-btn">
                      <button
                        onClick={stopPractice}
                        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg hover:bg-emerald-600 transition-colors"
                      >
                        Continue
                      </button>
                    </MagneticEffect>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`mb-8 text-center transition-opacity duration-300 ${isPracticing ? 'opacity-0' : 'opacity-100'}`}>
              <h3 className={`text-2xl font-bold mb-2 ${isLight ? 'text-black' : 'text-white'}`}>{layout} Layout</h3>
              <p className={isLight ? 'text-black/60' : 'text-white/60'}>
                {technique === 'Touch Typing' && "Color-coded by the finger you should use."}
                {technique === 'Hunt & Peck' && "Typically uses only index fingers. Not recommended for speed."}
                {technique === 'Hybrid' && "A mix of touch typing and visual searching. Common but inefficient."}
              </p>
            </div>

            {/* Keyboard Visualizer */}
            <div className={`flex flex-col items-center space-y-2 w-full max-w-3xl transition-transform duration-500 ${isPracticing ? 'translate-y-8' : ''}`}>
              {KEYBOARD_LAYOUTS[layout].map((row, rowIndex) => (
                <div 
                  key={rowIndex} 
                  className="flex justify-center space-x-2 w-full"
                  style={{ paddingLeft: `${rowIndex * 1.5}rem` }}
                >
                  {row.map((key) => {
                    const baseFinger = FINGER_MAPPING[layout][key] || 1;
                    const finger = getFingerForTechnique(baseFinger, technique);
                    const isTargetKey = isPracticing && !practiceComplete && key === practiceSequence[practiceIndex];
                    
                    let colorClass = FINGER_COLORS[finger as keyof typeof FINGER_COLORS];

                    if (isTargetKey) {
                      colorClass = 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)] scale-110 z-10 ring-4 ring-emerald-500/50';
                    } else if (isPracticing && !practiceComplete) {
                      colorClass = isLight ? 'bg-black/5 text-black/30 border-black/5' : 'bg-white/5 text-white/30 border-white/5';
                    }

                    return (
                      <div
                        key={key}
                        className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl border-2 font-mono text-lg sm:text-xl font-bold uppercase transition-all duration-300 ${colorClass}`}
                      >
                        {key}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="flex justify-center w-full mt-2">
                <div className={`w-64 sm:w-96 h-12 sm:h-14 rounded-xl border-2 flex items-center justify-center font-semibold transition-all duration-300 ${
                  technique === 'Touch Typing'
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                    : (isLight ? 'bg-black/5 text-black border-black/10' : 'bg-white/5 text-white border-white/10')
                }`}>
                  SPACE (Thumbs)
                </div>
              </div>
            </div>

            {/* Legend */}
            {technique === 'Touch Typing' && (
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-pink-500/50 border border-pink-500"></div>
                  <span className={`text-sm font-medium ${isLight ? 'text-black/70' : 'text-white/70'}`}>Pinky</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500/50 border border-purple-500"></div>
                  <span className={`text-sm font-medium ${isLight ? 'text-black/70' : 'text-white/70'}`}>Ring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500/50 border border-blue-500"></div>
                  <span className={`text-sm font-medium ${isLight ? 'text-black/70' : 'text-white/70'}`}>Middle</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/50 border border-emerald-500"></div>
                  <span className={`text-sm font-medium ${isLight ? 'text-black/70' : 'text-white/70'}`}>Index</span>
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard>
            <h3 className={`text-xl font-bold mb-4 ${isLight ? 'text-black' : 'text-white'}`}>About {technique}</h3>
            <div className={`space-y-4 ${isLight ? 'text-black/80' : 'text-white/80'} leading-relaxed`}>
              {technique === 'Touch Typing' && (
                <>
                  <p>Touch typing is a method based on muscle memory without using the sense of sight to find the keys. It involves placing your eight fingers in a horizontal row along the middle of the keyboard (the home row) and having them reach for other keys.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Home Row:</strong> ASDF for the left hand, JKL; for the right hand.</li>
                    <li><strong>Efficiency:</strong> Minimizes finger movement and eye strain.</li>
                    <li><strong>Speed:</strong> Allows for the fastest possible typing speeds once mastered.</li>
                  </ul>
                </>
              )}
              {technique === 'Hunt & Peck' && (
                <>
                  <p>Hunt and peck (also known as two-finger typing) is a common form of typing in which the typist presses each key individually. Instead of relying on memorized positions, the typist must find each key by sight.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Visual Reliance:</strong> Requires constantly looking down at the keyboard.</li>
                    <li><strong>Speed Limit:</strong> Significantly slower than touch typing due to visual searching.</li>
                    <li><strong>Ergonomics:</strong> Can lead to neck strain from constantly looking up and down.</li>
                  </ul>
                </>
              )}
              {technique === 'Hybrid' && (
                <>
                  <p>Hybrid typing is a mix of touch typing and hunt-and-peck. The typist may have memorized the locations of many keys but still relies on visual confirmation for others, often using more than two fingers but not a strict touch-typing system.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Adaptability:</strong> Often developed naturally by frequent computer users.</li>
                    <li><strong>Inconsistency:</strong> Speed varies greatly depending on the familiarity of the words.</li>
                    <li><strong>Improvement:</strong> Transitioning to full touch typing is recommended for maximum efficiency.</li>
                  </ul>
                </>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}
