export type QuestionCategory = "Saúde" | "Tecnologia" | "Conhecimentos Gerais";
export type CategoryFilter = QuestionCategory | "Misto";

export interface Question {
  id?: string;
  categoria: QuestionCategory;
  afirmacao: string;
  confiabilidade_referencia: number; // 0-100
  explicacao: string;
  fonte?: string;
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface Position {
  x: number;
  y: number;
}

export type GameStatus =
  | "START"
  | "PLAYING"
  | "QUESTION"
  | "FEEDBACK"
  | "GAMEOVER"
  | "VICTORY";

export interface QuestionResult {
  question: Question;
  guess: number;
  distance: number;
  isCorrect: boolean;
  points: number;
}

export interface GameStats {
  score: number;
  level: number;
  applesInLevel: number;
  totalApples: number;
  acertos: number;
  erros: number;
  category: CategoryFilter;
}

export type AppScreen = "login" | "home" | "categories" | "tutorial" | "journey" | "game";

export interface User {
  username: string;
  createdAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface UserStats {
  highScore: number;
  maxLevel: number;
  gamesPlayed: number;
  totalAcertos: number;
  totalErros: number;
  streakDays: number;
  hasSeenTutorial: boolean;
  categoryStats: {
    saude: { acertos: number; total: number };
    tecnologia: { acertos: number; total: number };
    gerais: { acertos: number; total: number };
  };
  achievements: Achievement[];
}
