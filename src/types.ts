export interface Session {
  id: string;
  date: string;
  wpm: number;
  accuracy: number;
  settings: {
    punctuation: 'none' | 'basic' | 'intermediate';
    wordCount: number;
    wordDifficulty: 'basic' | 'intermediate' | 'advanced';
    capitalLetters: boolean;
    testMode?: 'words' | 'time' | 'zen';
    timeLimit?: number;
    keyboardSound?: boolean;
  };
}

export interface Record {
  id: string;
  date: string;
  title: string;
  wpm: number;
  accuracy: number;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: number;
  createdAt: number;
}

export type View = 'home' | 'test' | 'dashboard' | 'records' | 'tope' | 'notes' | 'lessons';
