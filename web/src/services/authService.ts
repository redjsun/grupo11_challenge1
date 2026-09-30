import { User, UserStats, GameStats } from "../types";

const USERS_STORAGE_KEY = "fako_registered_users";
const SESSION_STORAGE_KEY = "fako_active_session";
const STATS_STORAGE_KEY_PREFIX = "fako_stats_";

interface StoredUser {
  username: string;
  passwordHash: string; // Simulação de hash local
  createdAt: number;
}

class AuthService {
  private getStoredUsers(): Record<string, StoredUser> {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveStoredUsers(users: Record<string, StoredUser>): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  /**
   * Realiza login simulado via localStorage.
   * Estruturado para ser facilmente substituído por:
   * const res = await fetch('/api/auth/login', { method: 'POST', body: ... });
   */
  public async login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      return { success: false, error: "Preencha todos os campos." };
    }

    const users = this.getStoredUsers();
    const stored = users[cleanUser.toLowerCase()];

    if (!stored || stored.passwordHash !== password) {
      return { success: false, error: "Nome de usuário ou senha incorretos." };
    }

    const sessionUser: User = {
      username: stored.username,
      createdAt: stored.createdAt,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  }

  /**
   * Realiza cadastro simulado via localStorage.
   * Estruturado para ser facilmente substituído por:
   * const res = await fetch('/api/auth/register', { method: 'POST', body: ... });
   */
  public async register(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      return { success: false, error: "O nome de usuário deve ter pelo menos 3 caracteres." };
    }
    if (password.length < 4) {
      return { success: false, error: "A senha deve ter pelo menos 4 caracteres." };
    }

    const users = this.getStoredUsers();
    const key = cleanUser.toLowerCase();

    if (users[key]) {
      return { success: false, error: "Este nome de usuário já está em uso. Escolha outro." };
    }

    const newUser: StoredUser = {
      username: cleanUser,
      passwordHash: password,
      createdAt: Date.now(),
    };

    users[key] = newUser;
    this.saveStoredUsers(users);

    const sessionUser: User = {
      username: newUser.username,
      createdAt: newUser.createdAt,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));

    // Inicializa estatísticas para o novo usuário
    this.saveUserStats(cleanUser, {
      highScore: 0,
      maxLevel: 1,
      gamesPlayed: 0,
      totalAcertos: 0,
      totalErros: 0,
      hasSeenTutorial: false,
    });

    return { success: true, user: sessionUser };
  }

  public getCurrentUser(): User | null {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  }

  public logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  public getUserStats(username: string): UserStats {
    try {
      const data = localStorage.getItem(STATS_STORAGE_KEY_PREFIX + username.toLowerCase());
      if (data) return JSON.parse(data);
    } catch {
      // Ignora erro
    }
    return {
      highScore: 0,
      maxLevel: 1,
      gamesPlayed: 0,
      totalAcertos: 0,
      totalErros: 0,
      hasSeenTutorial: false,
    };
  }

  public saveUserStats(username: string, stats: UserStats): void {
    localStorage.setItem(STATS_STORAGE_KEY_PREFIX + username.toLowerCase(), JSON.stringify(stats));
  }

  public recordGameFinished(username: string, gameStats: GameStats): void {
    const current = this.getUserStats(username);
    const updated: UserStats = {
      highScore: Math.max(current.highScore, gameStats.score),
      maxLevel: Math.max(current.maxLevel, gameStats.level),
      gamesPlayed: current.gamesPlayed + 1,
      totalAcertos: current.totalAcertos + gameStats.acertos,
      totalErros: current.totalErros + gameStats.erros,
      hasSeenTutorial: true,
    };
    this.saveUserStats(username, updated);
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
