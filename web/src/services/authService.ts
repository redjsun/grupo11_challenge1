import { User, UserStats, GameStats, Achievement } from "../types";
import { httpGet, httpPost, setAuthToken, getAuthToken } from "./httpClient";

const SESSION_STORAGE_KEY = "fako_active_session";
const STATS_STORAGE_KEY_PREFIX = "fako_stats_";

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_check",
    title: "Primeira Checagem",
    description: "Completou a avaliação da sua primeira maçã no FAKO.",
    icon: "🍏",
    unlocked: false,
  },
  {
    id: "bullseye",
    title: "Na Mosca!",
    description: "Acertou a confiabilidade com 100% de exatidão.",
    icon: "🎯",
    unlocked: false,
  },
  {
    id: "level_up",
    title: "Subindo de Nível",
    description: "Alcançou o Nível 2 ou superior no jogo da cobrinha.",
    icon: "⚡",
    unlocked: false,
  },
  {
    id: "imune",
    title: "Muralha Antifake",
    description: "Acertou 5 perguntas sem errar nenhuma na mesma partida.",
    icon: "🛡️",
    unlocked: false,
  },
  {
    id: "master",
    title: "Mestre dos Fatos",
    description: "Concluiu com maestria todos os 6 níveis do FAKO!",
    icon: "👑",
    unlocked: false,
  },
];

class AuthService {
  public async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      return { success: false, error: "Preencha todos os campos." };
    }

    try {
      const tokenResp = await httpPost<{ access_token: string }>("/auth/login", {
        username: cleanUser,
        password,
      });
      setAuthToken(tokenResp.access_token);

      const userResp = await httpGet<User>("/users/me");
      const sessionUser: User = {
        id: userResp.id,
        username: userResp.username,
        is_admin: userResp.is_admin,
        createdAt: Date.now(),
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Nome de usuário ou senha incorretos.",
      };
    }
  }

  public async register(
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      return { success: false, error: "O nome de usuário deve ter pelo menos 3 caracteres." };
    }
    if (password.length < 6) {
      return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
    }

    try {
      const tokenResp = await httpPost<{ access_token: string }>("/auth/register", {
        username: cleanUser,
        password,
      });
      setAuthToken(tokenResp.access_token);

      const userResp = await httpGet<User>("/users/me");
      const sessionUser: User = {
        id: userResp.id,
        username: userResp.username,
        is_admin: userResp.is_admin,
        createdAt: Date.now(),
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Não foi possível cadastrar o usuário.",
      };
    }
  }

  public async loginAsGuest(): Promise<{ success: boolean; error?: string; user?: User }> {
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const guestName = `visitante_${guestNum}`;
    const guestPass = `guest_${guestNum}pass`;

    try {
      const tokenResp = await httpPost<{ access_token: string }>("/auth/register", {
        username: guestName,
        password: guestPass,
      });
      setAuthToken(tokenResp.access_token);

      const userResp = await httpGet<User>("/users/me");
      const sessionUser: User = {
        id: userResp.id,
        username: userResp.username,
        is_admin: userResp.is_admin,
        createdAt: Date.now(),
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao entrar como visitante.",
      };
    }
  }

  public getCurrentUser(): User | null {
    try {
      const token = getAuthToken();
      if (!token) return null;
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  }

  public async fetchCurrentUser(): Promise<User | null> {
    try {
      const token = getAuthToken();
      if (!token) return null;
      const userResp = await httpGet<User>("/users/me");
      const sessionUser: User = {
        id: userResp.id,
        username: userResp.username,
        is_admin: userResp.is_admin,
        createdAt: Date.now(),
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    } catch {
      this.logout();
      return null;
    }
  }

  public logout(): void {
    setAuthToken(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  public getUserStats(username: string): UserStats {
    try {
      const data = localStorage.getItem(STATS_STORAGE_KEY_PREFIX + username.toLowerCase());
      if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.achievements) parsed.achievements = DEFAULT_ACHIEVEMENTS;
        if (!parsed.categoryStats) {
          parsed.categoryStats = {
            saude: { acertos: 0, total: 0 },
            tecnologia: { acertos: 0, total: 0 },
            gerais: { acertos: 0, total: 0 },
          };
        }
        if (!parsed.streakDays) parsed.streakDays = 1;
        return parsed;
      }
    } catch {
      // Ignora erro
    }
    return {
      highScore: 0,
      maxLevel: 1,
      gamesPlayed: 0,
      totalAcertos: 0,
      totalErros: 0,
      streakDays: 1,
      hasSeenTutorial: false,
      categoryStats: {
        saude: { acertos: 0, total: 0 },
        tecnologia: { acertos: 0, total: 0 },
        gerais: { acertos: 0, total: 0 },
      },
      achievements: DEFAULT_ACHIEVEMENTS,
    };
  }

  public saveUserStats(username: string, stats: UserStats): void {
    localStorage.setItem(STATS_STORAGE_KEY_PREFIX + username.toLowerCase(), JSON.stringify(stats));
  }

  public recordGameFinished(username: string, gameStats: GameStats): void {
    const current = this.getUserStats(username);
    const newAchievements = [...current.achievements];

    const unlock = (id: string) => {
      const ach = newAchievements.find((a) => a.id === id);
      if (ach && !ach.unlocked) {
        ach.unlocked = true;
        ach.unlockedAt = Date.now();
      }
    };

    if (gameStats.totalApples > 0) unlock("first_check");
    if (gameStats.level >= 2) unlock("level_up");
    if (gameStats.acertos >= 5) unlock("imune");
    if (gameStats.level >= 6) unlock("master");

    const updated: UserStats = {
      highScore: Math.max(current.highScore, gameStats.score),
      maxLevel: Math.max(current.maxLevel, gameStats.level),
      gamesPlayed: current.gamesPlayed + 1,
      totalAcertos: current.totalAcertos + gameStats.acertos,
      totalErros: current.totalErros + gameStats.erros,
      streakDays: Math.max(1, current.streakDays),
      hasSeenTutorial: true,
      categoryStats: current.categoryStats,
      achievements: newAchievements,
    };
    this.saveUserStats(username, updated);
  }

  public recordBullseye(username: string): void {
    const current = this.getUserStats(username);
    const ach = current.achievements.find((a) => a.id === "bullseye");
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      ach.unlockedAt = Date.now();
      this.saveUserStats(username, current);
    }
  }

  public hasSeenTutorial(username: string): boolean {
    const stats = this.getUserStats(username);
    return stats.hasSeenTutorial;
  }

  public markTutorialAsSeen(username: string): void {
    const stats = this.getUserStats(username);
    stats.hasSeenTutorial = true;
    this.saveUserStats(username, stats);
  }
}

export const authService = new AuthService();
