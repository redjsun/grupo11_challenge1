import React from "react";
import { User, UserStats } from "../types";

interface HomeScreenProps {
  user: User;
  stats: UserStats;
  onPlay: () => void;
  onTutorial: () => void;
  onJourney: () => void;
  onLogout: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  theme: "auto" | "light" | "dark";
  onToggleTheme: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  stats,
  onPlay,
  onTutorial,
  onJourney,
  onLogout,
  isMuted,
  onToggleMute,
  theme,
  onToggleTheme,
}) => {
  return (
    <div className="home-page">
      {/* Barra de Navegação Superior */}
      <header className="home-topbar">
        <div className="topbar-logo">
          <span className="logo-icon" aria-hidden="true">🍏</span>
          <div className="logo-titles">
            <span className="logo-text">FAKO</span>
            <span className="logo-subtitle">Hub do Jogador</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="user-profile-badge" title={`Conectado como ${user.username}`}>
            <span className="user-avatar-circle">{user.username.charAt(0).toUpperCase()}</span>
            <span className="user-name-text">{user.username}</span>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              onClick={onToggleMute}
              title={isMuted ? "Ativar efeitos sonoros" : "Mutar sons"}
              aria-label={isMuted ? "Ativar sons" : "Mutar sons"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>

            <button
              type="button"
              className="icon-button"
              onClick={onToggleTheme}
              title={`Tema atual: ${theme === "auto" ? "Sistema" : theme === "dark" ? "Escuro" : "Claro"}`}
              aria-label="Alternar tema visual"
            >
              {theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🌓"}
            </button>

            <button
              type="button"
              className="icon-button logout-button"
              onClick={onLogout}
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Saudação e Banner Principal Hero (Estilo Figma) */}
      <section className="home-hero-card">
        <div className="hero-content">
          <div className="hero-badge">👋 Bem-vindo de volta!</div>
          <h2 className="hero-title">
            Pronto para sua próxima checagem, {user.username}?
          </h2>
          <p className="hero-subtitle">
            Colete maçãs, analise a confiabilidade de fatos reais em 15 segundos e complete os 6 níveis sem se morder!
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="action-button hero-play-btn"
              onClick={onPlay}
            >
              Jogar Agora ➔
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onTutorial}
            >
              Ver Regras
            </button>
          </div>
        </div>

        <div className="hero-stats-overview">
          <div className="overview-pill">
            <span className="overview-label">Recorde</span>
            <span className="overview-val text-accent">{stats.highScore} pts</span>
          </div>
          <div className="overview-pill">
            <span className="overview-label">Nível Máximo</span>
            <span className="overview-val">{stats.maxLevel} / 6</span>
          </div>
          <div className="overview-pill">
            <span className="overview-label">Partidas</span>
            <span className="overview-val">{stats.gamesPlayed}</span>
          </div>
        </div>
      </section>

      {/* Grid de 3 Ações Principais Solicitadas */}
      <section className="home-actions-section">
        <h3 className="section-title">Navegação Principal</h3>

        <div className="cards-grid">
          {/* Card 1: Jogar */}
          <div
            className="action-card card-play"
            onClick={onPlay}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPlay()}
          >
            <div className="card-top">
              <span className="card-icon">🎮</span>
              <span className="card-badge badge-green">Iniciar</span>
            </div>
            <h4 className="card-title">Jogar Cobrinha</h4>
            <p className="card-desc">
              Comece a partida imediatamente. Avalie afirmações e avance pelos 6 níveis.
            </p>
            <div className="card-footer">
              <span className="card-link">Jogar agora ➔</span>
            </div>
          </div>

          {/* Card 2: Tutorial */}
          <div
            className="action-card card-tutorial"
            onClick={onTutorial}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onTutorial()}
          >
            <div className="card-top">
              <span className="card-icon">📖</span>
              <span className="card-badge badge-blue">Como Jogar</span>
            </div>
            <h4 className="card-title">Tutorial Interativo</h4>
            <p className="card-desc">
              Revise o passo a passo sobre os controles, o sistema de perguntas e a barra de confiabilidade.
            </p>
            <div className="card-footer">
              <span className="card-link">Abrir tutorial ➔</span>
            </div>
          </div>

          {/* Card 3: Minha Jornada */}
          <div
            className="action-card card-journey"
            onClick={onJourney}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onJourney()}
          >
            <div className="card-top">
              <span className="card-icon">🧭</span>
              <span className="card-badge badge-amber">Progresso</span>
            </div>
            <h4 className="card-title">Minha Jornada</h4>
            <p className="card-desc">
              Veja seu histórico de pontuação, taxa de precisão crítica e novidades que estão chegando.
            </p>
            <div className="card-footer">
              <span className="card-link">Ver histórico ➔</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
