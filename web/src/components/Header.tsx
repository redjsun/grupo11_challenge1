import React from "react";
import { soundEffects } from "../services/audioService";

interface HeaderProps {
  score: number;
  level: number;
  applesInLevel: number;
  maxApplesPerLevel: number;
  maxLevels: number;
  isMuted: boolean;
  onToggleMute: () => void;
  theme: "auto" | "light" | "dark";
  onToggleTheme: () => void;
  onGoHome?: () => void;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({
  score,
  level,
  applesInLevel,
  maxApplesPerLevel,
  maxLevels,
  isMuted,
  onToggleMute,
  theme,
  onToggleTheme,
  onGoHome,
  username,
}) => {
  const progressPercent = Math.min(100, Math.round((applesInLevel / maxApplesPerLevel) * 100));

  return (
    <header className="fako-header">
      <div className="header-top">
        <div className="logo-group">
          <span className="logo-icon" aria-hidden="true">🍏</span>
          <div className="logo-titles">
            <h1 className="logo-text">FAKO</h1>
            <span className="logo-subtitle">{username ? `Jogador: ${username}` : "Checador da Cobrinha"}</span>
          </div>
        </div>

        <div className="header-actions">
          {onGoHome && (
            <button
              type="button"
              className="icon-button home-nav-btn"
              onClick={onGoHome}
              title="Voltar para a tela inicial"
              aria-label="Voltar para a tela inicial"
            >
              🏠
            </button>
          )}

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
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-pill score-pill">
          <span className="stat-label">Pontos</span>
          <span className="stat-value" id="score-display">{score}</span>
        </div>

        <div className="stat-pill level-pill">
          <span className="stat-label">Nível</span>
          <span className="stat-value">
            {level}<span className="stat-total">/{maxLevels}</span>
          </span>
        </div>

        <div className="stat-pill apples-pill">
          <div className="apples-info">
            <span className="stat-label">Maçãs</span>
            <span className="stat-value">
              {applesInLevel}<span className="stat-total">/{maxApplesPerLevel}</span>
            </span>
          </div>
          <div className="progress-track" title={`${applesInLevel} de ${maxApplesPerLevel} maçãs no nível`}>
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
