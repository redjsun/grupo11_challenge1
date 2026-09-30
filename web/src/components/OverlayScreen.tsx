import React from "react";
import { GameStats, GameStatus } from "../types";

interface OverlayScreenProps {
  status: GameStatus;
  stats: GameStats;
  onStart: () => void;
  onRestart: () => void;
  onGoHome?: () => void;
}

export const OverlayScreen: React.FC<OverlayScreenProps> = ({
  status,
  stats,
  onStart,
  onRestart,
  onGoHome,
}) => {
  if (status !== "START" && status !== "GAMEOVER" && status !== "VICTORY") {
    return null;
  }

  const totalQuestions = stats.acertos + stats.erros;
  const accuracy = totalQuestions > 0 ? Math.round((stats.acertos / totalQuestions) * 100) : 0;

  return (
    <div className="overlay-container" role="dialog" aria-modal="true">
      <div className="overlay-card">
        {status === "START" && (
          <div className="overlay-content start-screen">
            <div className="overlay-badge">🧠 Jogo Educativo de Checagem</div>
            <h2 className="overlay-title">Desafio FAKO</h2>
            <p className="overlay-subtitle">
              Treine sua capacidade crítica contra fake news na velocidade da cobrinha!
            </p>

            <div className="rules-list">
              <div className="rule-item">
                <span className="rule-icon">🍏</span>
                <div>
                  <strong>Colete a maçã:</strong> O jogo pausa e abre uma afirmação real de Saúde, Tecnologia ou Conhecimentos Gerais.
                </div>
              </div>

              <div className="rule-item">
                <span className="rule-icon">⏱️</span>
                <div>
                  <strong>Avalie em 15s:</strong> Deslize a barra de 0% (Nada confiável) a 100% (Totalmente confiável).
                </div>
              </div>

              <div className="rule-item">
                <span className="rule-icon">🎯</span>
                <div>
                  <strong>Margem de 15 pontos:</strong> Palpites com distância de até 15 da referência oficial pontuam cheio.
                </div>
              </div>

              <div className="rule-item">
                <span className="rule-icon">🐍</span>
                <div>
                  <strong>A cobrinha só cresce no erro:</strong> Acertar não aumenta a cobra! Ela só cresce quando você erra.
                </div>
              </div>

              <div className="rule-item">
                <span className="rule-icon">🏆</span>
                <div>
                  <strong>6 Níveis de Progressão:</strong> A cada 10 maçãs você sobe de nível. Complete o nível 6 para vencer!
                </div>
              </div>
            </div>

            <button
              type="button"
              className="action-button start-button"
              onClick={onStart}
              autoFocus
            >
              Começar a Jogar ➔
            </button>
            {onGoHome && (
              <button
                type="button"
                className="secondary-button"
                style={{ width: "100%", marginTop: "6px" }}
                onClick={onGoHome}
              >
                Voltar ao Início
              </button>
            )}
          </div>
        )}

        {status === "GAMEOVER" && (
          <div className="overlay-content gameover-screen">
            <div className="overlay-status-icon">💥</div>
            <h2 className="overlay-title">A cobrinha se mordeu!</h2>
            <p className="overlay-subtitle">
              Você colidiu com seu próprio corpo. Mas sua mente ficou mais afiada!
            </p>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-card-label">Pontuação</span>
                <span className="stat-card-value text-accent">{stats.score}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Nível Alcançado</span>
                <span className="stat-card-value">{stats.level} / 6</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Acertos</span>
                <span className="stat-card-value text-success">{stats.acertos}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Erros</span>
                <span className="stat-card-value text-danger">{stats.erros}</span>
              </div>
              <div className="stat-card full-width">
                <span className="stat-card-label">Precisão na Análise Crítica</span>
                <span className="stat-card-value">{accuracy}%</span>
              </div>
            </div>

            <button
              type="button"
              className="action-button restart-button"
              onClick={onRestart}
              autoFocus
            >
              Jogar Novamente 🔄
            </button>
            {onGoHome && (
              <button
                type="button"
                className="secondary-button"
                style={{ width: "100%", marginTop: "6px" }}
                onClick={onGoHome}
              >
                Voltar ao Início 🏠
              </button>
            )}
          </div>
        )}

        {status === "VICTORY" && (
          <div className="overlay-content victory-screen">
            <div className="overlay-status-icon">🏆</div>
            <h2 className="overlay-title">Você Zerou o FAKO!</h2>
            <p className="overlay-subtitle">
              Incrível! Você completou os 6 níveis de checagem de fatos com maestria!
            </p>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-card-label">Pontuação Final</span>
                <span className="stat-card-value text-accent">{stats.score}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Nível</span>
                <span className="stat-card-value text-success">6 / 6 (Mestre)</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Acertos</span>
                <span className="stat-card-value text-success">{stats.acertos}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-label">Erros</span>
                <span className="stat-card-value text-danger">{stats.erros}</span>
              </div>
              <div className="stat-card full-width">
                <span className="stat-card-label">Taxa de Acerto Crítico</span>
                <span className="stat-card-value">{accuracy}%</span>
              </div>
            </div>

            <button
              type="button"
              className="action-button victory-button"
              onClick={onRestart}
              autoFocus
            >
              Jogar Novamente 🔄
            </button>
            {onGoHome && (
              <button
                type="button"
                className="secondary-button"
                style={{ width: "100%", marginTop: "6px" }}
                onClick={onGoHome}
              >
                Voltar ao Início 🏠
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
