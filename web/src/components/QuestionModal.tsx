import React, { useState, useEffect, useRef } from "react";
import { Question, QuestionResult } from "../types";
import { soundEffects } from "../services/audioService";

interface QuestionModalProps {
  question: Question;
  isAnswered: boolean;
  result: QuestionResult | null;
  onConfirm: (guess: number) => void;
  onResume: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  isAnswered,
  result,
  onConfirm,
  onResume,
}) => {
  const QUESTION_DURATION = 45;
  const [guess, setGuess] = useState<number>(50);
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_DURATION);
  const timerRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(QUESTION_DURATION);

  // Reiniciar estado da pergunta
  useEffect(() => {
    setGuess(50);
    setTimeLeft(QUESTION_DURATION);
    lastSecondRef.current = QUESTION_DURATION;

    const deadline = Date.now() + QUESTION_DURATION * 1000;

    timerRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Efeito sonoro nos últimos 5 segundos
      if (remaining <= 5 && remaining > 0 && remaining !== lastSecondRef.current) {
        soundEffects.playTick();
        lastSecondRef.current = remaining;
      }

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Auto-confirmação com o palpite corrente
        setGuess((currentVal) => {
          onConfirm(currentVal);
          return currentVal;
        });
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [question, onConfirm]);

  // Se já foi respondido, limpa o cronômetro
  useEffect(() => {
    if (isAnswered && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isAnswered]);

  // Teclas Enter / Espaço para confirmar ou continuar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!isAnswered) {
          onConfirm(guess);
        } else {
          onResume();
        }
      } else if (e.key === " " && isAnswered) {
        e.preventDefault();
        onResume();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswered, guess, onConfirm, onResume]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAnswered) return;
    setGuess(Number(e.target.value));
  };

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case "Saúde":
        return "cat-saude";
      case "Tecnologia":
        return "cat-tecnologia";
      case "Conhecimentos Gerais":
        return "cat-gerais";
      default:
        return "cat-default";
    }
  };

  const isLowTime = timeLeft <= 5 && !isAnswered;

  return (
    <div className="bubble-backdrop" role="dialog" aria-modal="true" aria-labelledby="question-text">
      <div className="speech-bubble">
        {/* Cabeçalho do balão: Categoria e Cronômetro */}
        <div className="bubble-header">
          <span className={`category-tag ${getCategoryClass(question.categoria)}`}>
            {question.categoria}
          </span>
          <div className={`countdown-timer ${isLowTime ? "timer-alert" : ""}`}>
            <span className="timer-icon">⏳</span>
            <span className="timer-seconds">{isAnswered ? "Finalizado" : `${timeLeft}s`}</span>
          </div>
        </div>

        {/* Afirmação para checagem */}
        <p className="statement-text" id="question-text">
          "{question.afirmacao}"
        </p>

        {/* FASE 1: Seletor Deslizante de Confiabilidade */}
        {!isAnswered ? (
          <div className="slider-interaction">
            <div className="slider-feedback-box">
              <span className="slider-title">Qual é a confiabilidade desta informação?</span>
              <div className="slider-current-value">
                <span className="value-number">{guess}%</span>
                <span className="value-descriptor">
                  {guess <= 20
                    ? "Altamente duvidosa"
                    : guess <= 40
                    ? "Pouco confiável"
                    : guess <= 60
                    ? "Inconclusiva / Mediana"
                    : guess <= 80
                    ? "Bastante confiável"
                    : "Fortemente comprovada"}
                </span>
              </div>
            </div>

            <div className="slider-track-container">
              <input
                type="range"
                className="confidence-slider"
                min="0"
                max="100"
                step="5"
                value={guess}
                onChange={handleSliderChange}
                aria-label="Escala de confiabilidade de 0 a 100 porcento"
              />
              <div className="scale-extremes">
                <span>0% Nada confiável</span>
                <span>50%</span>
                <span>100% Totalmente confiável</span>
              </div>
            </div>

            <button
              type="button"
              className="action-button confirm-button"
              onClick={() => onConfirm(guess)}
            >
              Confirmar Palpite (Enter)
            </button>
          </div>
        ) : (
          /* FASE 2: Revelação da Referência e Feedback */
          <div className="feedback-reveal">
            {result && (
              <div className={`verdict-banner ${result.isCorrect ? "verdict-hit" : "verdict-miss"}`}>
                <div className="verdict-icon">{result.isCorrect ? "🎯" : "⚠️"}</div>
                <div className="verdict-details">
                  <h3 className="verdict-title">
                    {result.isCorrect ? "Mandou bem! Palpite no alvo!" : "Você ficou longe da referência!"}
                  </h3>
                  <p className="verdict-points">
                    {result.isCorrect
                      ? `+${result.points} pontos! (Diferença de apenas ${result.distance}%)`
                      : `0 pontos (Diferença de ${result.distance}% > 15). A cobrinha cresceu!`}
                  </p>
                </div>
              </div>
            )}

            {/* Trilha visual com os 2 marcadores: Você e Referência */}
            <div className="reveal-track-wrapper">
              <div className="reveal-track">
                {/* Marcador do Jogador */}
                <div
                  className="marker marker-you"
                  style={{ left: `${guess}%` }}
                  title={`Seu palpite: ${guess}%`}
                >
                  <div className="marker-pin marker-pin-you" />
                  <span className="marker-label marker-label-top">Você: {guess}%</span>
                </div>

                {/* Marcador da Referência Oficial */}
                <div
                  className="marker marker-ref"
                  style={{ left: `${question.confiabilidade_referencia}%` }}
                  title={`Referência: ${question.confiabilidade_referencia}%`}
                >
                  <div className="marker-pin marker-pin-ref" />
                  <span className="marker-label marker-label-bottom">
                    Referência: {question.confiabilidade_referencia}%
                  </span>
                </div>
              </div>

              <div className="scale-extremes">
                <span>0% Falsa / Nada Confiável</span>
                <span>100% Fato Comprovado</span>
              </div>
            </div>

            {/* Explicação pedagógica e fonte */}
            <div className="explanation-card">
              <h4 className="explanation-title">💡 Por que essa referência?</h4>
              <p className="explanation-text">{question.explicacao}</p>
              {question.fonte && (
                <div className="source-row">
                  <span className="source-label">Fonte de validação:</span>
                  <span className="source-text">{question.fonte}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="action-button resume-button"
              onClick={onResume}
              autoFocus
            >
              Continuar Jogo (Espaço / Enter) ➔
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
