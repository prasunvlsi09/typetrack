import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, Record, View, Note } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { doc, collection, onSnapshot, setDoc, getDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  isPinned: boolean;
  updatedAt: number;
  messages: Message[];
  model: 'turbo' | 'pro' | 'tt' | 'tt2' | 'apex';
}

interface AppState {
  view: View;
  setView: (view: View) => void;
  sessions: Session[];
  addSession: (session: Session) => void;
  clearSessions: () => Promise<void>;
  records: Record[];
  addRecord: (record: Record) => void;
  notes: Note[];
  addNote: (note: Note) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  settings: {
    punctuation: 'none' | 'basic' | 'intermediate';
    wordCount: number;
    wordDifficulty: 'basic' | 'intermediate' | 'advanced';
    capitalLetters: boolean;
    visualKeyboard: boolean;
    errorMode: 'free' | 'word' | 'letter';
    testMode: 'words' | 'time' | 'zen';
    timeLimit: number;
    keyboardSound: boolean;
    theme: 'dark' | 'light';
  };
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  user: User | null;
  authLoading: boolean;
  sharedStream: MediaStream | null;
  setSharedStream: (stream: MediaStream | null) => void;
  isTopeSidebarOpen: boolean;
  setIsTopeSidebarOpen: (isOpen: boolean) => void;
  chats: ChatSession[];
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  currentChatId: string;
  setCurrentChatId: (id: string) => void;
  isWebSearchEnabled: boolean;
  setIsWebSearchEnabled: (enabled: boolean) => void;
  isDeepThinkingEnabled: boolean;
  setIsDeepThinkingEnabled: (enabled: boolean) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const DEFAULT_SETTINGS = {
  punctuation: 'none' as const,
  wordCount: 50,
  wordDifficulty: 'basic' as const,
  capitalLetters: false,
  visualKeyboard: true,
  errorMode: 'free' as const,
  testMode: 'words' as const,
  timeLimit: 30,
  keyboardSound: false,
  theme: 'dark' as const,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('home');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sharedStream, setSharedStream] = useState<MediaStream | null>(null);
  const [isTopeSidebarOpen, setIsTopeSidebarOpen] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isDeepThinkingEnabled, setIsDeepThinkingEnabled] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<AppState['settings']>(DEFAULT_SETTINGS);

  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('tope_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((chat: any, index: number) => ({
            ...chat,
            id: chat.id || (Date.now() + index).toString(),
            title: chat.title || 'New Chat',
            messages: chat.messages || [],
            model: chat.model || 'pro',
            updatedAt: chat.updatedAt || Date.now(),
            isPinned: chat.isPinned || false
          }));
        }
      }
    } catch (e) {}
    return [{
      id: Date.now().toString(),
      title: 'New Chat',
      isPinned: false,
      updatedAt: Date.now(),
      messages: [{ id: '1', role: 'assistant', content: "Hi! I'm Tope, your AI assistant. How can I help you today?" }],
      model: 'pro'
    }];
  });

  const [currentChatId, setCurrentChatId] = useState<string>(chats[0]?.id);

  useEffect(() => {
    localStorage.setItem('tope_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setSessions([]);
        setRecords([]);
        setNotes([]);
        setSettings(DEFAULT_SETTINGS);
      } else {
        const isAdminEmail = currentUser.email === 'rajarin@typetrack.local' || currentUser.email === 'pratyus@typetrack.local' || currentUser.email === 'pratyusalt@typetrack.local' || currentUser.email === 'prasun.ece07@gmail.com';
        if (isAdminEmail && currentUser.displayName && currentUser.displayName.endsWith('.dev')) {
          const newDisplayName = currentUser.displayName.replace(/\.dev$/, '.admin');
          try {
            await updateProfile(currentUser, { displayName: newDisplayName });
            window.location.reload();
            return;
          } catch (e) {
            console.error("Failed to update admin display name", e);
          }
        }
      }
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Sync from Firebase
    const userRef = doc(db, 'users', user.uid);
    const sessionsRef = collection(db, 'users', user.uid, 'sessions');
    const recordsRef = collection(db, 'users', user.uid, 'records');
    const notesRef = collection(db, 'users', user.uid, 'notes');

    // Ensure user document exists and is up to date
    getDoc(userRef).then((docSnap) => {
      if (!docSnap.exists()) {
        const userData: any = { 
          uid: user.uid,
          email: user.email || '',
          settings: settings 
        };
        if (user.displayName) userData.displayName = user.displayName;
        if (user.photoURL) userData.photoURL = user.photoURL;
        
        setDoc(userRef, userData).catch(console.error);
      } else {
        const data = docSnap.data();
        const updates: any = {};
        if (user.email && data.email !== user.email) updates.email = user.email;
        if (user.photoURL && data.photoURL !== user.photoURL) updates.photoURL = user.photoURL;
        
        // Only sync display name if the base name changed (ignoring .admin/.dev suffixes)
        if (user.displayName) {
          const authBaseName = user.displayName.replace(/\.admin$/i, '').replace(/\.dev$/i, '');
          const dbBaseName = (data.displayName || '').replace(/\.admin$/i, '').replace(/\.dev$/i, '');
          if (authBaseName !== dbBaseName) {
            // Preserve the suffix from the database if it exists
            let suffix = '';
            if ((data.displayName || '').endsWith('.admin')) suffix = '.admin';
            else if ((data.displayName || '').endsWith('.dev')) suffix = '.dev';
            updates.displayName = authBaseName + suffix;
          }
        }

        if (Object.keys(updates).length > 0) {
          setDoc(userRef, updates, { merge: true }).catch(console.error);
        }
      }
    });

    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data().settings });
      }
    });

    const unsubSessions = onSnapshot(sessionsRef, (snapshot) => {
      const fetchedSessions: Session[] = [];
      snapshot.forEach(doc => fetchedSessions.push(doc.data() as Session));
      // Sort by date ascending
      fetchedSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setSessions(fetchedSessions);
    });

    const unsubRecords = onSnapshot(recordsRef, (snapshot) => {
      const fetchedRecords: Record[] = [];
      snapshot.forEach(doc => fetchedRecords.push(doc.data() as Record));
      fetchedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(fetchedRecords);
    });

    const unsubNotes = onSnapshot(notesRef, (snapshot) => {
      const fetchedNotes: Note[] = [];
      snapshot.forEach(doc => fetchedNotes.push(doc.data() as Note));
      fetchedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      setNotes(fetchedNotes);
    });

    return () => {
      unsubUser();
      unsubSessions();
      unsubRecords();
      unsubNotes();
    };
  }, [user]);

  const addSession = async (session: Session) => {
    if (user) {
      const sessionWithUser = { ...session, userId: user.uid };
      await setDoc(doc(db, 'users', user.uid, 'sessions', session.id), sessionWithUser);
    } else {
      setSessions(prev => [...prev, session]);
    }
  };

  const clearSessions = async () => {
    if (user) {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions');
      const snapshot = await getDocs(sessionsRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } else {
      setSessions([]);
    }
  };

  const addRecord = async (record: Record) => {
    if (user) {
      const recordWithUser = { ...record, userId: user.uid };
      await setDoc(doc(db, 'users', user.uid, 'records', record.id), recordWithUser);
    } else {
      setRecords(prev => [...prev, record]);
    }
  };

  const addNote = async (note: Note) => {
    if (user) {
      const noteWithUser = { ...note, userId: user.uid };
      await setDoc(doc(db, 'users', user.uid, 'notes', note.id), noteWithUser);
    } else {
      setNotes(prev => [note, ...prev]);
    }
  };

  const updateNote = async (note: Note) => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'notes', note.id), note, { merge: true });
    } else {
      setNotes(prev => prev.map(n => n.id === note.id ? note : n));
    }
  };

  const deleteNote = async (id: string) => {
    if (user) {
      await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
    } else {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const updateSettings = async (newSettings: Partial<AppState['settings']>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (user) {
      const userData: any = {
        uid: user.uid,
        email: user.email || '',
        settings: updated
      };
      if (user.displayName) userData.displayName = user.displayName;
      if (user.photoURL) userData.photoURL = user.photoURL;

      await setDoc(doc(db, 'users', user.uid), userData, { merge: true }).catch(console.error);
    }
  };

  return (
    <AppContext.Provider value={{ view, setView, sessions, addSession, clearSessions, records, addRecord, notes, addNote, updateNote, deleteNote, settings, updateSettings, user, authLoading, sharedStream, setSharedStream, isTopeSidebarOpen, setIsTopeSidebarOpen, chats, setChats, currentChatId, setCurrentChatId, isWebSearchEnabled, setIsWebSearchEnabled, isDeepThinkingEnabled, setIsDeepThinkingEnabled }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
