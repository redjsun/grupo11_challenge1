export type QuestionCategory = "Saúde" | "Tecnologia" | "Conhecimentos Gerais";

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
}

export type AppScreen = "login" | "home" | "tutorial" | "journey" | "game";

export interface User {
  username: string;
  createdAt: number;
}

export interface UserStats {
  highScore: number;
  maxLevel: number;
  gamesPlayed: number;
  totalAcertos: number;
  totalErros: number;
  hasSeenTutorial: boolean;
}
