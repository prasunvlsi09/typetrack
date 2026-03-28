import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { GlassCard } from './GlassCard';
import { generateWords } from '../utils/words';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, RefreshCw, Star } from 'lucide-react';
import MagneticEffect from './MagneticEffect';

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  [' ']
];

export function TypingTest() {
  const { user, settings, updateSettings, setView, addSession, sessions } = useAppContext();
  const isLight = settings.theme === 'light';
  const isDev = user?.displayName?.endsWith('.dev') || user?.displayName?.endsWith('.admin');
  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit || 30);
  const [isHighScore, setIsHighScore] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const initializeTest = () => {
    const count = settings.testMode === 'words' ? settings.wordCount : 100;
    const newWords = generateWords(
      count,
      settings.wordDifficulty,
      settings.punctuation,
      settings.capitalLetters
    );
    setWords(newWords);
    setInput('');
    setCurrentWordIndex(0);
    setStartTime(null);
    setEndTime(null);
    setCorrectChars(0);
    setIncorrectChars(0);
    setTimeLeft(settings.timeLimit || 30);
    setIsHighScore(false);
    setSessionSaved(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const finishTest = () => {
    if (endTime) return;
    setEndTime(Date.now());
  };

  useEffect(() => {
    if (endTime && startTime) {
      const timeInMinutes = (endTime - startTime) / 60000;
      const wpm = Math.round((correctChars / 5) / timeInMinutes);
      
      const previousHigh = sessions.length > 0 ? Math.max(...sessions.map(s => s.wpm)) : 0;
      if (wpm > previousHigh && wpm > 0) {
        setIsHighScore(true);
      }
    }
  }, [endTime]);

  const handleSetRecord = () => {
    if (!startTime || !endTime || sessionSaved) return;
    const timeInMinutes = (endTime - startTime) / 60000;
    const wpm = Math.round((correctChars / 5) / timeInMinutes);
    const accuracy = Math.round((correctChars / (correctChars + incorrectChars)) * 100) || 100;
    
    addSession({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      wpm,
      accuracy,
      settings: {
        punctuation: settings.punctuation,
        wordCount: settings.wordCount,
        wordDifficulty: settings.wordDifficulty,
        capitalLetters: settings.capitalLetters,
        testMode: settings.testMode,
        timeLimit: settings.timeLimit,
      }
    });
    setSessionSaved(true);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !endTime && settings.testMode === 'time') {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = (settings.timeLimit || 30) - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          finishTest();
        } else {
          setTimeLeft(remaining);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startTime, endTime, settings.testMode, settings.timeLimit]);

  useEffect(() => {
    initializeTest();
  }, [settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setActiveKey(e.key.toLowerCase());
      if (settings.keyboardSound && !['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        import('../utils/sound').then(({ playClickSound }) => playClickSound());
      }
      if (e.key === 'Escape') {
        initializeTest();
      }
    };
    const handleKeyUp = () => {
      setActiveKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings.keyboardSound]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    const targetWord = words[currentWordIndex];

    // Append words if getting close to the end in time or zen mode
    if (currentWordIndex >= words.length - 5 && settings.testMode !== 'words') {
      setWords(prev => [...prev, ...generateWords(50, settings.wordDifficulty, settings.punctuation, settings.capitalLetters)]);
    }

    const checkCompletion = (isExactMatch: boolean) => {
      if (settings.testMode === 'words' && currentWordIndex === words.length - 1 && isExactMatch) {
        finishTest();
      }
    };

    // Handle "stop on letter"
    if (settings.errorMode === 'letter') {
      if (val.length > input.length) {
        const newChar = val[val.length - 1];
        
        let firstErrorIndex = -1;
        for (let i = 0; i < input.length; i++) {
          if (input[i] !== targetWord[i]) {
            firstErrorIndex = i;
            break;
          }
        }

        if (firstErrorIndex !== -1) {
          const expectedChar = targetWord[firstErrorIndex];
          if (newChar === expectedChar) {
            const correctedInput = input.slice(0, firstErrorIndex) + newChar;
            setInput(correctedInput);
            if (correctedInput === targetWord) {
              if (settings.testMode === 'words' && currentWordIndex === words.length - 1) {
                setCorrectChars(prev => prev + correctedInput.length);
                finishTest();
              }
            }
          } else {
            setIncorrectChars(prev => prev + 1);
            setInput(input.slice(0, firstErrorIndex) + newChar);
          }
          return;
        }

        if (newChar === ' ') {
          if (input === targetWord) {
            setCorrectChars(prev => prev + input.length + 1);
            setInput('');
            setCurrentWordIndex(prev => prev + 1);
            checkCompletion(false);
          } else {
            setIncorrectChars(prev => prev + 1);
            setInput(input + ' ');
          }
          return;
        }

        const expectedChar = targetWord[input.length];
        if (newChar !== expectedChar) {
          setIncorrectChars(prev => prev + 1);
          setInput(input + newChar);
          return;
        }
      } else if (val.length < input.length) {
        setInput(val);
        return;
      }
      
      setInput(val);
      if (val === targetWord) {
        if (settings.testMode === 'words' && currentWordIndex === words.length - 1) {
          setCorrectChars(prev => prev + val.length);
          finishTest();
        }
      }
      return;
    }

    // Handle "stop on word"
    if (settings.errorMode === 'word') {
      if (val.endsWith(' ')) {
        const typedWord = val.slice(0, -1);
        if (typedWord !== targetWord) {
          setIncorrectChars(prev => prev + 1);
          return;
        }
        
        setCorrectChars(prev => prev + targetWord.length + 1);
        setInput('');
        setCurrentWordIndex(prev => prev + 1);
        checkCompletion(false);
        return;
      }
      
      setInput(val);
      if (val === targetWord) {
        if (settings.testMode === 'words' && currentWordIndex === words.length - 1) {
          setCorrectChars(prev => prev + targetWord.length);
          finishTest();
        }
      }
      return;
    }

    // Handle "free" (default)
    if (val.endsWith(' ')) {
      const typedWord = val.trim();
      
      let correct = 0;
      let incorrect = 0;
      
      for (let i = 0; i < Math.max(typedWord.length, targetWord.length); i++) {
        if (typedWord[i] === targetWord[i]) {
          correct++;
        } else {
          incorrect++;
        }
      }
      
      setCorrectChars(prev => prev + correct + 1); // +1 for space
      setIncorrectChars(prev => prev + incorrect);
      
      setInput('');
      setCurrentWordIndex(prev => prev + 1);
      checkCompletion(false);
    } else {
      setInput(val);
      if (val === targetWord) {
        if (settings.testMode === 'words' && currentWordIndex === words.length - 1) {
          setCorrectChars(prev => prev + targetWord.length);
          finishTest();
        }
      }
    }
  };

  const currentWpm = useMemo(() => {
    if (!startTime || endTime) return 0;
    const timeInMinutes = (Date.now() - startTime) / 60000;
    return Math.round(((correctChars + input.length) / 5) / timeInMinutes) || 0;
  }, [correctChars, input, startTime, endTime]);

  const currentAccuracy = useMemo(() => {
    const total = correctChars + incorrectChars;
    if (total === 0) return 100;
    return Math.round((correctChars / total) * 100);
  }, [correctChars, incorrectChars]);

  if (endTime) {
    const timeInMinutes = (endTime - (startTime || endTime)) / 60000;
    const wpm = Math.round((correctChars / 5) / timeInMinutes);
    const accuracy = Math.round((correctChars / (correctChars + incorrectChars)) * 100);

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center space-y-8"
      >
        <h2 className={`text-5xl font-bold drop-shadow-lg ${isLight ? 'text-black' : 'text-white'}`}>Test Complete</h2>
        <GlassCard className="grid grid-cols-2 gap-8 p-12">
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-6xl font-black text-emerald-500">{wpm}</div>
              {isHighScore && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  title="New High Score!"
                >
                  <Star className="w-10 h-10 text-emerald-500 fill-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                </motion.div>
              )}
            </div>
            <div className={`text-sm uppercase tracking-widest font-semibold ${isLight ? 'text-black/50' : 'text-white/50'}`}>WPM</div>
          </div>
          <div className="space-y-2">
            <div className="text-6xl font-black text-blue-500">{accuracy}%</div>
            <div className={`text-sm uppercase tracking-widest font-semibold ${isLight ? 'text-black/50' : 'text-white/50'}`}>Accuracy</div>
          </div>
        </GlassCard>
        <div className="flex justify-center space-x-4">
          <MagneticEffect>
            <button
              onClick={initializeTest}
              className={`px-8 py-4 border rounded-full backdrop-blur-2xl backdrop-saturate-200 transition-all duration-300 font-semibold flex items-center space-x-2 ${isLight ? 'bg-white/40 hover:bg-white/60 border-white/50 shadow-lg text-black' : 'bg-black/40 hover:bg-black/60 border-white/10 shadow-lg text-white'}`}
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </button>
          </MagneticEffect>
          {!sessionSaved && (
            <MagneticEffect>
              <button
                onClick={handleSetRecord}
                className="px-8 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-full backdrop-blur-2xl backdrop-saturate-200 shadow-lg transition-all duration-300 text-emerald-500 font-semibold flex items-center space-x-2"
              >
                <Star className="w-5 h-5" />
                <span>Set Record</span>
              </button>
            </MagneticEffect>
          )}
          <MagneticEffect>
            <button
              onClick={() => setView('dashboard')}
              className={`px-8 py-4 rounded-full font-bold transition-all duration-300 shadow-lg ${isLight ? 'bg-black text-white hover:bg-black/90' : 'bg-white text-black hover:bg-white/90'}`}
            >
              View Dashboard
            </button>
          </MagneticEffect>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex justify-between items-center">
        <div className="flex space-x-8">
          <div className={`font-mono text-xl ${isLight ? 'text-black/80' : 'text-white/80'}`}>
            <span className={`text-sm uppercase tracking-widest mr-2 ${isLight ? 'text-black/50' : 'text-white/50'}`}>WPM</span>
            {currentWpm}
          </div>
          <div className={`font-mono text-xl ${isLight ? 'text-black/80' : 'text-white/80'}`}>
            <span className={`text-sm uppercase tracking-widest mr-2 ${isLight ? 'text-black/50' : 'text-white/50'}`}>ACC</span>
            {currentAccuracy}%
          </div>
          {settings.testMode === 'time' && (
            <div className={`font-mono text-xl ${isLight ? 'text-black/80' : 'text-white/80'}`}>
              <span className={`text-sm uppercase tracking-widest mr-2 ${isLight ? 'text-black/50' : 'text-white/50'}`}>TIME</span>
              {timeLeft}s
            </div>
          )}
          {settings.testMode === 'words' && (
            <div className={`font-mono text-xl ${isLight ? 'text-black/80' : 'text-white/80'}`}>
              <span className={`text-sm uppercase tracking-widest mr-2 ${isLight ? 'text-black/50' : 'text-white/50'}`}>WORDS</span>
              {currentWordIndex}/{words.length}
            </div>
          )}
          {settings.testMode === 'zen' && (
            <div className={`font-mono text-xl ${isLight ? 'text-black/80' : 'text-white/80'}`}>
              <span className={`text-sm uppercase tracking-widest mr-2 ${isLight ? 'text-black/50' : 'text-white/50'}`}>TYPED</span>
              {currentWordIndex}
            </div>
          )}
        </div>
        <div className="flex space-x-4">
          {settings.testMode === 'zen' && startTime && (
            <button
              onClick={finishTest}
              className="px-4 py-1.5 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 transition-colors rounded-full font-bold text-sm"
            >
              Finish
            </button>
          )}
          <button
            onClick={initializeTest}
            className={`p-2 transition-colors rounded-full ${isLight ? 'text-black/50 hover:text-black hover:bg-black/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            title="Restart Test (Esc)"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 transition-colors rounded-full ${showSettings ? (isLight ? 'text-black bg-black/10' : 'text-white bg-white/10') : (isLight ? 'text-black/50 hover:text-black hover:bg-black/10' : 'text-white/50 hover:text-white hover:bg-white/10')}`}
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>Mode</label>
                <div className="flex space-x-2">
                  {['words', 'time', 'zen'].map(m => {
                    const isDevFeature = m === 'zen';
                    const isDisabled = isDevFeature && !isDev;
                    return (
                      <button
                        key={m}
                        onClick={() => !isDisabled && updateSettings({ testMode: m as 'words' | 'time' | 'zen' })}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize flex items-center space-x-1 ${settings.testMode === m ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isDisabled ? 'Developer Only Feature' : ''}
                      >
                        <span>{m}</span>
                        {isDisabled && <Star className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {settings.testMode === 'words' && (
                <div className="space-y-3">
                  <label className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>Word Count</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="200" 
                      value={settings.wordCount}
                      onChange={(e) => updateSettings({ wordCount: Number(e.target.value) })}
                      className={`flex-1 ${isLight ? 'accent-black' : 'accent-white'}`}
                    />
                    <span className={`font-mono w-8 ${isLight ? 'text-black' : 'text-white'}`}>{settings.wordCount}</span>
                  </div>
                </div>
              )}
              {settings.testMode === 'time' && (
                <div className="space-y-3">
                  <label className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>Time (s)</label>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      step="5"
                      value={settings.timeLimit}
                      onChange={(e) => updateSettings({ timeLimit: Number(e.target.value) })}
                      className={`flex-1 ${isLight ? 'accent-black' : 'accent-white'}`}
                    />
                    <span className={`font-mono w-8 ${isLight ? 'text-black' : 'text-white'}`}>{settings.timeLimit}</span>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>Punctuation</label>
                <div className="flex space-x-2">
                  {['none', 'basic', 'intermediate'].map(p => {
                    const isDevFeature = p === 'intermediate';
                    const isDisabled = isDevFeature && !isDev;
                    return (
                      <button
                        key={p}
                        onClick={() => !isDisabled && updateSettings({ punctuation: p as 'none' | 'basic' | 'intermediate' })}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${settings.punctuation === p ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isDisabled ? 'Developer Only Feature' : ''}
                      >
                        <span>{p}</span>
                        {isDisabled && <Star className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>Difficulty</label>
                <div className="flex space-x-2">
                  {['basic', 'intermediate', 'advanced'].map(d => {
                    const isDevFeature = d === 'advanced';
                    const isDisabled = isDevFeature && !isDev;
                    return (
                      <button
                        key={d}
                        onClick={() => !isDisabled && updateSettings({ wordDifficulty: d as 'basic' | 'intermediate' | 'advanced' })}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${settings.wordDifficulty === d ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isDisabled ? 'Developer Only Feature' : ''}
                      >
                        <span>{d}</span>
                        {isDisabled && <Star className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>Capital Letters</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateSettings({ capitalLetters: true })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${settings.capitalLetters ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')}`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => updateSettings({ capitalLetters: false })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!settings.capitalLetters ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')}`}
                  >
                    No
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>Error Mode</label>
                <div className="flex space-x-2">
                  {['free', 'word', 'letter'].map(m => {
                    const isDevFeature = m === 'free';
                    const isDisabled = isDevFeature && !isDev;
                    return (
                      <button
                        key={m}
                        onClick={() => !isDisabled && updateSettings({ errorMode: m as 'free' | 'word' | 'letter' })}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${settings.errorMode === m ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isDisabled ? 'Developer Only Feature' : ''}
                      >
                        <span>{m}</span>
                        {isDisabled && <Star className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>Visual Keyboard</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateSettings({ visualKeyboard: true })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${settings.visualKeyboard ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')}`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => updateSettings({ visualKeyboard: false })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!settings.visualKeyboard ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')}`}
                  >
                    No
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/50'}`}>Keyboard Sound</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateSettings({ keyboardSound: true })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${settings.keyboardSound ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')}`}
                  >
                    On
                  </button>
                  <button
                    onClick={() => updateSettings({ keyboardSound: false })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!settings.keyboardSound ? (isLight ? 'bg-black text-white' : 'bg-white text-black') : (isLight ? 'bg-black/5 text-black hover:bg-black/10' : 'bg-white/10 text-white hover:bg-white/20')}`}
                  >
                    Off
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className={`relative text-3xl leading-relaxed font-mono select-none cursor-text min-h-[120px] ${isLight ? 'text-black/40' : 'text-white/40'}`}
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInput}
          className="absolute inset-0 opacity-0 cursor-text"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {words.map((word, wIdx) => {
            const isCurrent = wIdx === currentWordIndex;
            const isPast = wIdx < currentWordIndex;
            
            return (
              <div key={wIdx} className={`relative flex ${isCurrent ? (isLight ? 'text-black' : 'text-white') : ''} ${isPast ? (isLight ? 'text-black/20' : 'text-white/20') : ''}`}>
                {word.split('').map((char, cIdx) => {
                  let charClass = '';
                  if (isCurrent) {
                    if (cIdx < input.length) {
                      charClass = input[cIdx] === char ? 'text-emerald-500' : 'text-red-500 bg-red-500/20 rounded';
                    }
                  }
                  return (
                    <span key={cIdx} className={charClass}>
                      {char}
                    </span>
                  );
                })}
                {isCurrent && input.length > word.length && (
                  <span className="text-red-500 bg-red-500/20 rounded">
                    {input.slice(word.length)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {settings.visualKeyboard && (
        <div className="pt-4">
          <GlassCard className="max-w-2xl mx-auto p-4 flex flex-col items-center space-y-1.5">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex space-x-1.5">
                {row.map((key) => {
                  const isActive = activeKey === key || (key === ' ' && activeKey === ' ');
                  return (
                    <div
                      key={key}
                      className={`
                        flex items-center justify-center font-mono text-xs uppercase rounded-md transition-all duration-75
                        ${key === ' ' ? 'w-48 h-10' : 'w-10 h-10'}
                        ${isActive 
                          ? (isLight ? 'bg-black text-white scale-95 shadow-[0_0_10px_rgba(0,0,0,0.3)]' : 'bg-white text-black scale-95 shadow-[0_0_10px_rgba(255,255,255,0.5)]') 
                          : (isLight ? 'bg-black/5 text-black/50 border border-black/10' : 'bg-white/5 text-white/50 border border-white/10')}
                      `}
                    >
                      {key === ' ' ? 'SPACE' : key}
                    </div>
                  );
                })}
              </div>
            ))}
          </GlassCard>
        </div>
      )}
    </motion.div>
  );
}
