import React from "react";
import { User, UserStats, QuestionCategory } from "../types";
import { FakoLogo } from "./FakoLogo";

export interface HomeScreenProps {
  user: User;
  stats: UserStats;
  onPlay: () => void;
  onSelectCategory?: (cat: QuestionCategory | "Misto") => void;
  onCategories: () => void;
  onTutorial: () => void;
  onJourney: () => void;
  onLogout: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  stats,
  onPlay,
  onSelectCategory,
  onTutorial,
  onJourney,
  onLogout,
  isMuted,
  onToggleMute,
  theme,
  onToggleTheme,
}) => {
  // Cálculo de precisão ou fallback pedagógico
  const totalChecks = stats.totalAcertos + stats.totalErros;
  const accuracyPercentage =
    totalChecks > 0 ? Math.round((stats.totalAcertos / totalChecks) * 100) : 78;
  const displayScore = stats.highScore > 0 ? stats.highScore : 240;
  const displayGames = stats.gamesPlayed > 0 ? stats.gamesPlayed : 12;
  const currentLevel = Math.min(6, Math.max(1, stats.maxLevel || 3));

  const handleCategoryClick = (cat: QuestionCategory) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      onPlay();
    }
  };

  return (
    <div className="figma-home-wrapper">
      {/* ================= BARRA DE NAVEGAÇÃO SUPERIOR (FIGMA) ================= */}
      <header className="figma-home-topbar">
        {/* Logo FAKO Oficial (3 segmentos + maçã + FAKO) */}
        <div className="figma-nav-left">
          <FakoLogo size="medium" textColor={theme === "dark" ? "#ffffff" : "#112a17"} />
        </div>

        {/* Links Centrais em Pílula */}
        <nav className="figma-nav-center" aria-label="Navegação Principal">
          <button
            type="button"
            className="nav-link-pill active"
            aria-current="page"
          >
            Início
          </button>
          <button
            type="button"
            className="nav-link-pill"
            onClick={onTutorial}
          >
            Tutorial
          </button>
          <button
            type="button"
            className="nav-link-pill"
            onClick={onJourney}
          >
            Jornada
          </button>
        </nav>

        {/* Lado Direito: Perfil do Usuário e Controles */}
        <div className="figma-nav-right">
          {/* Badge de Perfil com Avatar e Nome do Usuário */}
          <div className="figma-user-chip" title={`Logado como ${user.username}`}>
            <div className="user-avatar-gold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-chip-texts">
              <span className="user-chip-name">{user.username}</span>
              <span className="user-chip-details">
                Nível {currentLevel} • {displayScore} pts
              </span>
            </div>
          </div>

          {/* Controles de Som, Tema Estrito e Logout */}
          <div className="figma-quick-controls">
            <button
              type="button"
              className="figma-control-icon-btn"
              onClick={onToggleTheme}
              title={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}
              aria-label="Alternar tema claro/escuro"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>

            <button
              type="button"
              className="figma-control-icon-btn"
              onClick={onToggleMute}
              title={isMuted ? "Ativar som" : "Desativar som"}
              aria-label={isMuted ? "Ativar som" : "Desativar som"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>

            <button
              type="button"
              className="figma-control-icon-btn logout"
              onClick={onLogout}
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* ================= GRID PRINCIPAL EM 2 COLUNAS (FIGMA SCREEN 02) ================= */}
      <main className="figma-home-grid">
        {/* ================= COLUNA ESQUERDA (PRINCIPAL) ================= */}
        <div className="figma-main-column">
          {/* 1. Hero Card Verde (#2BA84A) */}
          <section className="figma-hero-banner" aria-label="Ação rápida">
            <div className="hero-text-side">
              <div className="hero-user-tag">
                <span>Olá, {user.username}! 🌿</span>
              </div>

              <h1 className="hero-headline-title">
                Pronto para caçar algumas fakes hoje?
              </h1>

              <p className="hero-headline-desc">
                Partidas de 120 segundos. Cada maçã traz uma informação para você analisar.
              </p>

              <div className="hero-button-row">
                <button
                  type="button"
                  className="hero-primary-btn"
                  onClick={onPlay}
                >
                  Jogar agora ➔
                </button>
                <button
                  type="button"
                  className="hero-secondary-btn"
                  onClick={onTutorial}
                >
                  Como jogar
                </button>
              </div>
            </div>

            {/* Mini Tabuleiro da Cobrinha Inclinado */}
            <div className="hero-board-side" aria-hidden="true">
              <div className="hero-mini-board">
                <div className="mini-checkered-grid">
                  <div className="grid-snake-cell cell-1" />
                  <div className="grid-snake-cell cell-2" />
                  <div className="grid-snake-cell cell-3" />
                  <div className="grid-apple-circle" />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Seção: Categorias das informações */}
          <section className="figma-categories-section">
            <div className="categories-header-row">
              <h2 className="categories-title">Categorias das informações</h2>
              <span className="categories-validation-badge">
                Validadas antes de chegar até você ✓
              </span>
            </div>

            <div className="categories-cards-trio">
              {/* Card 1: Saúde */}
              <div
                className="category-white-card cat-saude"
                onClick={() => handleCategoryClick("Saúde")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleCategoryClick("Saúde")}
              >
                <div className="cat-icon-circle saude">
                  <span>🩺</span>
                </div>
                <h3 className="cat-card-title saude-title">Saúde</h3>
                <p className="cat-card-desc">
                  Mitos e fatos sobre corpo, vacinas e bem-estar.
                </p>
              </div>

              {/* Card 2: Tecnologia */}
              <div
                className="category-white-card cat-tecnologia"
                onClick={() => handleCategoryClick("Tecnologia")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleCategoryClick("Tecnologia")}
              >
                <div className="cat-icon-circle tecnologia">
                  <span>💻</span>
                </div>
                <h3 className="cat-card-title tecnologia-title">Tecnologia</h3>
                <p className="cat-card-desc">
                  Golpes, IA, redes sociais e o mundo digital.
                </p>
              </div>

              {/* Card 3: Conhecimentos Gerais */}
              <div
                className="category-white-card cat-gerais"
                onClick={() => handleCategoryClick("Conhecimentos Gerais")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleCategoryClick("Conhecimentos Gerais")
                }
              >
                <div className="cat-icon-circle gerais">
                  <span>🌍</span>
                </div>
                <h3 className="cat-card-title gerais-title">Conhecimentos Gerais</h3>
                <p className="cat-card-desc">
                  História, ciência e curiosidades do mundo.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Card Escuro: Como o FAKO funciona */}
          <section className="figma-flow-card" aria-label="Como funciona o jogo">
            <h3 className="flow-card-heading">Como o FAKO funciona</h3>
            <div className="flow-steps-track">
              <div className="flow-step-item">
                <span className="step-icon">🐍</span>
                <span className="step-label">Jogar</span>
              </div>
              <span className="flow-arrow-separator">➔</span>

              <div className="flow-step-item">
                <span className="step-icon">🍎</span>
                <span className="step-label">Coletar</span>
              </div>
              <span className="flow-arrow-separator">➔</span>

              <div className="flow-step-item">
                <span className="step-icon">🔍</span>
                <span className="step-label">Analisar</span>
              </div>
              <span className="flow-arrow-separator">➔</span>

              <div className="flow-step-item">
                <span className="step-icon">🤔</span>
                <span className="step-label">Decidir</span>
              </div>
              <span className="flow-arrow-separator">➔</span>

              <div className="flow-step-item">
                <span className="step-icon">💬</span>
                <span className="step-label">Feedback</span>
              </div>
              <span className="flow-arrow-separator">➔</span>

              <div className="flow-step-item highlight-learn">
                <span className="step-icon">🎓</span>
                <span className="step-label">Aprender</span>
              </div>
            </div>
          </section>
        </div>

        {/* ================= COLUNA DIREITA (TELEMETRIA & HISTÓRICO) ================= */}
        <aside className="figma-sidebar-column">
          {/* Card: Sua jornada */}
          <div className="figma-side-card journey-card">
            <div className="side-card-top-header">
              <h3 className="side-card-heading">Sua jornada</h3>
              <span className="journey-level-tag">
                Nível {currentLevel} de 6
              </span>
            </div>

            {/* Trilha de 6 Níveis em Círculos */}
            <div className="journey-level-steps" aria-label="Progresso nos níveis">
              {[1, 2, 3, 4, 5, 6].map((lvl) => {
                const isCompleted = lvl < currentLevel;
                const isCurrent = lvl === currentLevel;
                return (
                  <div
                    key={lvl}
                    className={`level-step-circle ${
                      isCompleted ? "completed" : isCurrent ? "current" : "locked"
                    }`}
                    title={`Nível ${lvl} ${
                      isCompleted ? "(Concluído)" : isCurrent ? "(Atual)" : "(Bloqueado)"
                    }`}
                  >
                    {isCompleted ? "✓" : lvl}
                  </div>
                );
              })}
            </div>

            {/* Faixa explicativa do tamanho do tabuleiro */}
            <div className="journey-grid-info-pill">
              <span className="info-check">✓</span>
              <span>Níveis 1–3: tabuleiro 7×7 • Níveis 4–6: 6×6</span>
            </div>
          </div>

          {/* Grid de 3 Métricas Rápidas */}
          <div className="figma-stats-trio-row">
            <div className="stat-metric-box">
              <span className="metric-large-number">{displayScore}</span>
              <span className="metric-sub-label">Melhor pontuação</span>
            </div>

            <div className="stat-metric-box">
              <span className="metric-large-number">{accuracyPercentage}%</span>
              <span className="metric-sub-label">Taxa de acertos</span>
            </div>

            <div className="stat-metric-box">
              <span className="metric-large-number">{displayGames}</span>
              <span className="metric-sub-label">Partidas jogadas</span>
            </div>
          </div>

          {/* Card: Última partida */}
          <div className="figma-side-card last-match-card">
            <h3 className="side-card-heading">Última partida</h3>

            <div className="last-match-facts-list">
              {/* Item 1 */}
              <div className="fact-item-row">
                <div className="fact-item-icon check-green">✓</div>
                <div className="fact-item-body">
                  <span className="fact-statement">Vacinas causam autismo.</span>
                  <span className="fact-tagline">Não confiável • Saúde</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="fact-item-row">
                <div className="fact-item-icon cross-red">✕</div>
                <div className="fact-item-body">
                  <span className="fact-statement">
                    A Muralha da China é visível do espaço a olho nu.
                  </span>
                  <span className="fact-tagline">Não confiável • Conh. Gerais</span>
                </div>
              </div>

              {/* Item 3 */}
              <div className="fact-item-row">
                <div className="fact-item-icon check-green">✓</div>
                <div className="fact-item-body">
                  <span className="fact-statement">
                    Senhas longas são mais seguras que senhas curtas.
                  </span>
                  <span className="fact-tagline">Confiável • Tecnologia</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
