import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Direction,
  Position,
  GameStatus,
  Question,
  QuestionResult,
  GameStats,
  AppScreen,
  User,
  UserStats,
  CategoryFilter,
} from "./types";
import { nextQuestion, resetQuestionDeck } from "./services/questionService";
import { soundEffects } from "./services/audioService";
import { authService } from "./services/authService";
import { Header } from "./components/Header";
import { GameBoard } from "./components/GameBoard";
import { QuestionModal } from "./components/QuestionModal";
import { DpadControls } from "./components/DpadControls";
import { OverlayScreen } from "./components/OverlayScreen";
import { LoginScreen } from "./components/LoginScreen";
import { HomeScreen } from "./components/HomeScreen";
import { CategoriesScreen } from "./components/CategoriesScreen";
import { TutorialScreen } from "./components/TutorialScreen";
import { JourneyScreen } from "./components/JourneyScreen";

const GRID_SIZE = 16;
const APPLES_PER_LEVEL = 10;
const MAX_LEVELS = 6;

const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

export default function App() {
  // Estado de Autenticação e Navegação
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    const user = authService.getCurrentUser();
    if (!user) return "login";
    return authService.hasSeenTutorial(user.username) ? "home" : "tutorial";
  });
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const user = authService.getCurrentUser();
    return user
      ? authService.getUserStats(user.username)
      : {
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
          achievements: [],
        };
  });

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("Misto");

  // Estado do Jogo (Snake)
  const [status, setStatus] = useState<GameStatus>("START");
  const [snake, setSnake] = useState<Position[]>([
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 6, y: 8 },
  ]);
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [apple, setApple] = useState<Position | null>(null);

  // Estatísticas da Partida Atual
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [applesInLevel, setApplesInLevel] = useState<number>(0);
  const [totalApples, setTotalApples] = useState<number>(0);
  const [acertos, setAcertos] = useState<number>(0);
  const [erros, setErros] = useState<number>(0);

  // Pergunta Corrente e Resposta
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isQuestionAnswered, setIsQuestionAnswered] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<QuestionResult | null>(null);

  // Configurações Globais (Apenas Claro e Escuro)
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuted());
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("fako_theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch {
      // fallback
    }
    return "light";
  });

  // Referências mutáveis para loop de jogo
  const nextDirRef = useRef<Direction>("RIGHT");
  const currentDirRef = useRef<Direction>("RIGHT");
  const snakeRef = useRef<Position[]>(snake);
  const appleRef = useRef<Position | null>(apple);
  const growPendingRef = useRef<number>(0);
  const statusRef = useRef<GameStatus>(status);
  const levelRef = useRef<number>(level);
  const applesInLevelRef = useRef<number>(applesInLevel);
  const gameLoopTimerRef = useRef<number | null>(null);

  // Sincronizar referências
  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    appleRef.current = apple;
  }, [apple]);

  useEffect(() => {
    currentDirRef.current = direction;
  }, [direction]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    applesInLevelRef.current = applesInLevel;
  }, [applesInLevel]);

  // Aplicar tema no elemento raiz (sempre "light" ou "dark")
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("fako_theme", theme);
    } catch {
      // Ignora erro de localStorage
    }
  }, [theme]);

  // Sincronizar stats do usuário quando mudar
  const refreshUserStats = useCallback(() => {
    if (currentUser) {
      setUserStats(authService.getUserStats(currentUser.username));
    }
  }, [currentUser]);

  // Posicionar maçã em célula livre
  const placeRandomApple = useCallback((currentSnake: Position[]): Position => {
    const freeCells: Position[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const isOccupied = currentSnake.some((seg) => seg.x === x && seg.y === y);
        if (!isOccupied) {
          freeCells.push({ x, y });
        }
      }
    }

    if (freeCells.length === 0) {
      return { x: 0, y: 0 };
    }

    const randomIndex = Math.floor(Math.random() * freeCells.length);
    return freeCells[randomIndex];
  }, []);

  // Mudança segura de direção
  const changeDirection = useCallback((newDir: Direction) => {
    if (statusRef.current !== "PLAYING") return;
    if (OPPOSITE_DIRECTIONS[newDir] === currentDirRef.current) return;
    nextDirRef.current = newDir;
  }, []);

  // Velocidade do jogo por nível
  const getSpeed = useCallback((currentLvl: number) => {
    const baseSpeed = 160;
    const decrement = (currentLvl - 1) * 14;
    return Math.max(75, baseSpeed - decrement);
  }, []);

  // Passo único de movimentação da cobrinha
  const step = useCallback(() => {
    if (statusRef.current !== "PLAYING") return;

    const currentSnake = snakeRef.current;
    const activeDir = nextDirRef.current;
    setDirection(activeDir);

    let dx = 0;
    let dy = 0;
    switch (activeDir) {
      case "UP":
        dy = -1;
        break;
      case "DOWN":
        dy = 1;
        break;
      case "LEFT":
        dx = -1;
        break;
      case "RIGHT":
        dx = 1;
        break;
    }

    const head = currentSnake[0];
    const newHead: Position = {
      x: (head.x + dx + GRID_SIZE) % GRID_SIZE,
      y: (head.y + dy + GRID_SIZE) % GRID_SIZE,
    };

    // Colisão com o corpo
    const hitSelf = currentSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y);
    if (hitSelf) {
      soundEffects.playGameOver();
      setStatus("GAMEOVER");

      if (currentUser) {
        authService.recordGameFinished(currentUser.username, {
          score,
          level,
          applesInLevel,
          totalApples,
          acertos,
          erros,
          category: selectedCategory,
        });
        refreshUserStats();
      }
      return;
    }

    const newSnake = [newHead, ...currentSnake];

    // Cobrinha só cresce se errou a pergunta
    if (growPendingRef.current > 0) {
      growPendingRef.current -= 1;
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);

    // Checagem de maçã comida
    const currentApple = appleRef.current;
    if (currentApple && newHead.x === currentApple.x && newHead.y === currentApple.y) {
      soundEffects.playEat();
      setStatus("QUESTION");

      const question = nextQuestion(selectedCategory);
      setCurrentQuestion(question);
      setIsQuestionAnswered(false);
      setLastResult(null);

      const nextApplePos = placeRandomApple(newSnake);
      setApple(nextApplePos);
    }
  }, [placeRandomApple, currentUser, score, level, applesInLevel, totalApples, acertos, erros, selectedCategory, refreshUserStats]);

  // Loop de Jogo
  useEffect(() => {
    if (currentScreen === "game" && status === "PLAYING") {
      const interval = getSpeed(level);
      gameLoopTimerRef.current = window.setInterval(step, interval);
    } else {
      if (gameLoopTimerRef.current) {
        clearInterval(gameLoopTimerRef.current);
        gameLoopTimerRef.current = null;
      }
    }

    return () => {
      if (gameLoopTimerRef.current) {
        clearInterval(gameLoopTimerRef.current);
        gameLoopTimerRef.current = null;
      }
    };
  }, [currentScreen, status, level, step, getSpeed]);

  // Iniciar Novo Jogo
  const startGame = useCallback((cat: CategoryFilter = "Misto") => {
    resetQuestionDeck(cat);
    growPendingRef.current = 0;
    const initialSnake: Position[] = [
      { x: 8, y: 8 },
      { x: 7, y: 8 },
      { x: 6, y: 8 },
    ];
    setSnake(initialSnake);
    setDirection("RIGHT");
    nextDirRef.current = "RIGHT";

    setScore(0);
    setLevel(1);
    setApplesInLevel(0);
    setTotalApples(0);
    setAcertos(0);
    setErros(0);
    setCurrentQuestion(null);
    setIsQuestionAnswered(false);
    setLastResult(null);

    const initialApple = placeRandomApple(initialSnake);
    setApple(initialApple);

    setStatus("PLAYING");
  }, [placeRandomApple]);

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen !== "game") return;

      const key = e.key;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)) {
        e.preventDefault();
      }

      if (statusRef.current === "PLAYING") {
        if (key === "ArrowUp" || key === "w" || key === "W") changeDirection("UP");
        else if (key === "ArrowDown" || key === "s" || key === "S") changeDirection("DOWN");
        else if (key === "ArrowLeft" || key === "a" || key === "A") changeDirection("LEFT");
        else if (key === "ArrowRight" || key === "d" || key === "D") changeDirection("RIGHT");
      } else if (statusRef.current === "START" || statusRef.current === "GAMEOVER" || statusRef.current === "VICTORY") {
        if (key === "Enter" || key === " ") {
          e.preventDefault();
          startGame(selectedCategory);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentScreen, changeDirection, startGame, selectedCategory]);

  // Confirmação de Resposta
  const handleConfirmQuestion = (guess: number) => {
    if (!currentQuestion || isQuestionAnswered) return;

    const distance = Math.abs(guess - currentQuestion.confiabilidade_referencia);
    const isCorrect = distance <= 15;

    let pointsAwarded = 0;
    if (isCorrect) {
      pointsAwarded = distance === 0 ? 120 : 100;
      soundEffects.playCorrect();
      setAcertos((prev) => prev + 1);

      if (distance === 0 && currentUser) {
        authService.recordBullseye(currentUser.username);
        refreshUserStats();
      }
    } else {
      pointsAwarded = 0;
      growPendingRef.current += 1;
      soundEffects.playMistake();
      setErros((prev) => prev + 1);
    }

    setScore((prev) => prev + pointsAwarded);

    const result: QuestionResult = {
      question: currentQuestion,
      guess,
      distance,
      isCorrect,
      points: pointsAwarded,
    };

    setLastResult(result);
    setIsQuestionAnswered(true);
  };

  // Retomada do Jogo após Resposta
  const handleResumeGame = () => {
    const nextApplesInLevel = applesInLevelRef.current + 1;
    const nextTotalApples = totalApples + 1;
    setTotalApples(nextTotalApples);

    let nextLvl = levelRef.current;
    let resetApples = nextApplesInLevel;

    if (nextApplesInLevel >= APPLES_PER_LEVEL) {
      if (nextLvl >= MAX_LEVELS) {
        soundEffects.playVictory();
        setStatus("VICTORY");

        if (currentUser) {
          authService.recordGameFinished(currentUser.username, {
            score,
            level: 6,
            applesInLevel: 10,
            totalApples: nextTotalApples,
            acertos,
            erros,
            category: selectedCategory,
          });
          refreshUserStats();
        }
        return;
      }
      nextLvl += 1;
      resetApples = 0;
      setLevel(nextLvl);
    }

    setApplesInLevel(resetApples);
    setCurrentQuestion(null);
    setIsQuestionAnswered(false);
    setLastResult(null);

    setStatus("PLAYING");
  };

  // NAVEGAÇÃO DE ROTAS
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    const stats = authService.getUserStats(user.username);
    setUserStats(stats);

    if (!stats.hasSeenTutorial) {
      setCurrentScreen("tutorial");
    } else {
      setCurrentScreen("home");
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentScreen("login");
  };

  const handlePlayFromHome = (cat: CategoryFilter = "Misto") => {
    if (!currentUser) {
      setCurrentScreen("login");
      return;
    }
    const hasSeen = authService.hasSeenTutorial(currentUser.username);
    setSelectedCategory(cat);
    if (!hasSeen) {
      setCurrentScreen("tutorial");
    } else {
      setCurrentScreen("game");
      startGame(cat);
    }
  };

  const handleTutorialComplete = () => {
    if (currentUser) {
      authService.markTutorialAsSeen(currentUser.username);
      refreshUserStats();
    }
    setCurrentScreen("game");
    startGame(selectedCategory);
  };

  const handleTutorialSkip = () => {
    if (currentUser) {
      authService.markTutorialAsSeen(currentUser.username);
      refreshUserStats();
    }
    setCurrentScreen("game");
    startGame(selectedCategory);
  };

  const handleGoHome = () => {
    if (gameLoopTimerRef.current) {
      clearInterval(gameLoopTimerRef.current);
      gameLoopTimerRef.current = null;
    }
    setStatus("START");
    refreshUserStats();
    setCurrentScreen("home");
  };

  const handleToggleMute = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const gameStats: GameStats = {
    score,
    level,
    applesInLevel,
    totalApples,
    acertos,
    erros,
    category: selectedCategory,
  };

  const totalAnswered = acertos + erros;
  const currentAccuracy = totalAnswered > 0 ? Math.round((acertos / totalAnswered) * 100) : 100;

  return (
    <div className={`fako-app screen-${currentScreen}`}>
      {/* 1. TELA DE LOGIN / CADASTRO */}
      {currentScreen === "login" && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* 2. TELA INICIAL (DASHBOARD FIGMA) */}
      {currentScreen === "home" && currentUser && (
        <HomeScreen
          user={currentUser}
          stats={userStats}
          onPlay={() => handlePlayFromHome("Misto")}
          onSelectCategory={(cat) => handlePlayFromHome(cat)}
          onCategories={() => setCurrentScreen("categories")}
          onTutorial={() => setCurrentScreen("tutorial")}
          onJourney={() => setCurrentScreen("journey")}
          onLogout={handleLogout}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* 3. TELA DE CATEGORIAS (NOVA DO FIGMA) */}
      {currentScreen === "categories" && (
        <CategoriesScreen
          onSelectCategory={(cat) => handlePlayFromHome(cat)}
          onBack={() => setCurrentScreen("home")}
        />
      )}

      {/* 4. TELA DE TUTORIAL */}
      {currentScreen === "tutorial" && (
        <TutorialScreen
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* 5. TELA MINHA JORNADA */}
      {currentScreen === "journey" && currentUser && (
        <JourneyScreen
          user={currentUser}
          stats={userStats}
          onBack={() => setCurrentScreen("home")}
          onPlay={() => handlePlayFromHome("Misto")}
        />
      )}

      {/* 6. TELA DO JOGO (SNAKE COM LAYOUT EXPANDIDO FIGMA SCREEN 4) */}
      {currentScreen === "game" && (
        <main className="game-screen-wrapper">
          {/* Header Mobile / Topo */}
          <div className="game-top-bar-mobile">
            <Header
              score={score}
              level={level}
              applesInLevel={applesInLevel}
              maxApplesPerLevel={APPLES_PER_LEVEL}
              maxLevels={MAX_LEVELS}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onGoHome={handleGoHome}
              username={currentUser?.username}
            />
          </div>

          <div className="game-expanded-layout">
            {/* Coluna Esquerda: Telemetria e Vidas (Figma Screen 4) */}
            <aside className="game-side-panel left-panel">
              <div className="side-card main-stats-card">
                <span className="side-card-badge">🍏 Partida FAKO</span>
                <div className="side-stat-row">
                  <span className="side-stat-label">Pontos</span>
                  <span className="side-stat-val text-accent">{score}</span>
                </div>
                <div className="side-stat-row">
                  <span className="side-stat-label">Nível</span>
                  <span className="side-stat-val">{level} <small>/ {MAX_LEVELS}</small></span>
                </div>
                <div className="side-progress-box">
                  <div className="side-progress-header">
                    <span>Maçãs no Nível</span>
                    <span>{applesInLevel}/{APPLES_PER_LEVEL}</span>
                  </div>
                  <div className="side-progress-track">
                    <div
                      className="side-progress-fill"
                      style={{ width: `${(applesInLevel / APPLES_PER_LEVEL) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="side-card snake-status-card">
                <h4 className="side-card-title">🐍 Status da Cobra</h4>
                <div className="side-metric-item">
                  <span className="metric-name">Comprimento</span>
                  <span className="metric-val">{snake.length} blocos</span>
                </div>
                <div className="side-metric-item">
                  <span className="metric-name">Crescimento no erro</span>
                  <span className="metric-val text-danger">+{erros}</span>
                </div>
              </div>
            </aside>

            {/* Coluna Central: O Tabuleiro 16x16 */}
            <section className="game-center-board">
              <div className="board-interactive-area">
                <GameBoard
                  gridSize={GRID_SIZE}
                  snake={snake}
                  direction={direction}
                  apple={apple}
                  onSwipe={changeDirection}
                />

                {/* Modal / Balão da Pergunta */}
                {status === "QUESTION" && currentQuestion && (
                  <QuestionModal
                    question={currentQuestion}
                    isAnswered={isQuestionAnswered}
                    result={lastResult}
                    onConfirm={handleConfirmQuestion}
                    onResume={handleResumeGame}
                  />
                )}

                {/* Telas de Início, Fim de Jogo e Vitória */}
                <OverlayScreen
                  status={status}
                  stats={gameStats}
                  onStart={() => startGame(selectedCategory)}
                  onRestart={() => startGame(selectedCategory)}
                  onGoHome={handleGoHome}
                />
              </div>

              {/* Controles Virtuais D-pad */}
              <DpadControls
                onDirectionChange={changeDirection}
                disabled={status !== "PLAYING"}
              />
            </section>

            {/* Coluna Direita: Análise Crítica e Controles Rápidos (Figma Screen 4) */}
            <aside className="game-side-panel right-panel">
              <div className="side-card session-category-card">
                <span className="side-card-badge">Área Temática</span>
                <h4 className="category-active-title">
                  {selectedCategory === "Misto" ? "🎲 Modo Desafio Misto" : selectedCategory}
                </h4>
                <p className="category-active-desc">
                  Afirmações reais checadas com base na literatura científica e institucional.
                </p>
              </div>

              <div className="side-card accuracy-card">
                <h4 className="side-card-title">🎯 Precisão da Rodada</h4>
                <div className="accuracy-big-number">{currentAccuracy}%</div>
                <div className="side-counts-row">
                  <span className="count-hit">✅ {acertos} acertos</span>
                  <span className="count-miss">❌ {erros} erros</span>
                </div>
              </div>

              <div className="side-card quick-nav-card">
                <button
                  type="button"
                  className="secondary-button side-nav-btn"
                  onClick={handleGoHome}
                >
                  🏠 Voltar ao Hub
                </button>
                <button
                  type="button"
                  className="secondary-button side-nav-btn"
                  onClick={() => setCurrentScreen("tutorial")}
                >
                  📖 Ver Regras
                </button>
              </div>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}
