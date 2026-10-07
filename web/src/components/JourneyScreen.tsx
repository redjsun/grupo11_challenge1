import React from "react";
import { User, UserStats } from "../types";

interface JourneyScreenProps {
  user: User;
  stats: UserStats;
  onBack: () => void;
  onPlay: () => void;
}

export const JourneyScreen: React.FC<JourneyScreenProps> = ({
  user,
  stats,
  onBack,
  onPlay,
}) => {
  const totalQuestions = stats.totalAcertos + stats.totalErros;
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((stats.totalAcertos / totalQuestions) * 100) : 0;

  // Precisão estimada por categoria para o relatório do Figma
  const saudePct = 85;
  const tecPct = 90;
  const geraisPct = 80;

  return (
    <div className="journey-page">
      <div className="journey-container">
        {/* Cabeçalho */}
        <div className="journey-topbar">
          <button type="button" className="secondary-button" onClick={onBack}>
            ← Voltar
          </button>
          <span className="journey-badge">🧭 Minha Jornada & Conquistas</span>
        </div>

        {/* Card do Usuário (Figma Screen 5) */}
        <div className="journey-user-card">
          <div className="journey-avatar-large">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="journey-user-info">
            <h2 className="journey-user-name">{user.username}</h2>
            <p className="journey-user-tagline">Checador Crítico de Informações</p>
            <div className="user-streak-chip">
              <span>🔥 Sequência de {stats.streakDays} {stats.streakDays === 1 ? "dia" : "dias"}</span>
            </div>
          </div>
        </div>

        {/* Estatísticas Numéricas Gerais */}
        <div className="journey-stats-section">
          <h3 className="section-title">Desempenho Geral</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-card-label">Maior Pontuação</span>
              <span className="stat-card-value text-accent">{stats.highScore}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Nível Recorde</span>
              <span className="stat-card-value">{stats.maxLevel} / 6</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Partidas Jogadas</span>
              <span className="stat-card-value">{stats.gamesPlayed}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Total de Acertos</span>
              <span className="stat-card-value text-success">{stats.totalAcertos}</span>
            </div>
            <div className="stat-card full-width">
              <span className="stat-card-label">Precisão Crítica Geral</span>
              <span className="stat-card-value">{overallAccuracy}%</span>
            </div>
          </div>
        </div>

        {/* Relatório de Precisão por Categoria (Barras Coloridas do Figma Screen 5) */}
        <div className="journey-categories-report">
          <h3 className="section-title">Precisão por Categoria</h3>
          <div className="category-bars-card">
            <div className="cat-bar-item">
              <div className="cat-bar-header">
                <span className="cat-bar-name">🌿 Saúde & Bem-Estar</span>
                <span className="cat-bar-pct">{saudePct}%</span>
              </div>
              <div className="cat-bar-track">
                <div className="cat-bar-fill fill-saude" style={{ width: `${saudePct}%` }} />
              </div>
            </div>

            <div className="cat-bar-item">
              <div className="cat-bar-header">
                <span className="cat-bar-name">💻 Tecnologia & Segurança</span>
                <span className="cat-bar-pct">{tecPct}%</span>
              </div>
              <div className="cat-bar-track">
                <div className="cat-bar-fill fill-tec" style={{ width: `${tecPct}%` }} />
              </div>
            </div>

            <div className="cat-bar-item">
              <div className="cat-bar-header">
                <span className="cat-bar-name">🌍 Conhecimentos Gerais</span>
                <span className="cat-bar-pct">{geraisPct}%</span>
              </div>
              <div className="cat-bar-track">
                <div className="cat-bar-fill fill-gerais" style={{ width: `${geraisPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Galeria de Conquistas (Badges em Grid do Figma Screen 5) */}
        <div className="journey-achievements-section">
          <div className="achievements-header">
            <h3 className="section-title">Galeria de Medalhas</h3>
            <span className="achievements-count">
              {stats.achievements.filter((a) => a.unlocked).length} / {stats.achievements.length}
            </span>
          </div>

          <div className="achievements-grid">
            {stats.achievements.map((ach) => (
              <div
                key={ach.id}
                className={`achievement-card ${ach.unlocked ? "unlocked" : "locked"}`}
              >
                <div className="ach-icon-circle">{ach.unlocked ? ach.icon : "🔒"}</div>
                <div className="ach-info">
                  <h4 className="ach-title">{ach.title}</h4>
                  <p className="ach-desc">{ach.description}</p>
                </div>
                <div className="ach-status">
                  {ach.unlocked ? (
                    <span className="ach-pill pill-unlocked">Conquistada ✅</span>
                  ) : (
                    <span className="ach-pill pill-locked">Bloqueada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ação */}
        <button type="button" className="action-button" onClick={onPlay}>
          Jogar Agora ➔
        </button>
      </div>
    </div>
  );
};
