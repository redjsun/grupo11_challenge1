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

  return (
    <div className="journey-page">
      <div className="journey-container">
        {/* Cabeçalho */}
        <div className="journey-topbar">
          <button type="button" className="secondary-button" onClick={onBack}>
            ← Voltar ao Início
          </button>
          <span className="journey-badge">🧭 Minha Jornada</span>
        </div>

        {/* Card do Usuário */}
        <div className="journey-user-card">
          <div className="journey-avatar-large">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="journey-user-info">
            <h2 className="journey-user-name">{user.username}</h2>
            <p className="journey-user-tagline">Checador Crítico de Informações</p>
          </div>
        </div>

        {/* Estatísticas Salvas Localmente */}
        <div className="journey-stats-section">
          <h3 className="section-title">Estatísticas Salvas no Navegador</h3>
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

        {/* Sessão Placeholder: Em Breve */}
        <div className="journey-upcoming-card">
          <div className="upcoming-badge">🚀 Em Breve no Próximo Nível</div>
          <h4 className="upcoming-title">Conquistas & Ranking Global</h4>
          <p className="upcoming-desc">
            Estamos preparando um ranking competitivo de checadores e distintivos desbloqueáveis para reconhecer sua habilidade contra desinformação!
          </p>

          <div className="badges-preview-row">
            <div className="mock-badge locked" title="Em breve">
              <span className="badge-icon">🎯</span>
              <span className="badge-name">Na Mosca</span>
            </div>
            <div className="mock-badge locked" title="Em breve">
              <span className="badge-icon">⚡</span>
              <span className="badge-name">Super Veloz</span>
            </div>
            <div className="mock-badge locked" title="Em breve">
              <span className="badge-icon">👑</span>
              <span className="badge-name">Mestre Nível 6</span>
            </div>
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
