import React, { useState } from "react";

interface TutorialScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface TutorialStep {
  id: number;
  badge: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  visualSnippet?: React.ReactNode;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      id: 1,
      badge: "Passo 1 de 5",
      icon: "🎯",
      title: "Objetivo do Jogo",
      subtitle: "Jogue Snake enquanto exercita sua análise crítica",
      description:
        "O FAKO une a nostalgia do clássico jogo da cobrinha com o combate às fake news. Sua missão é guiar a cobra pelo tabuleiro, coletar maçãs e avaliar a veracidade de afirmações sobre Saúde, Tecnologia e Conhecimentos Gerais.",
      visualSnippet: (
        <div className="tutorial-visual-box visual-step-1">
          <div className="preview-bubble">
            <span className="preview-tag">Saúde</span>
            <span className="preview-text">"Tomar vitamina C previne resfriado?"</span>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      badge: "Passo 2 de 5",
      icon: "🕹️",
      title: "Como Controlar a Cobrinha",
      subtitle: "Múltiplas formas de comando e bordas conectadas",
      description:
        "No computador, use as Setas do teclado ou as teclas W, A, S, D. No celular ou tablet, deslize o dedo (swipe) na tela ou toque nos botões direcionais. As bordas do tabuleiro se conectam: atravessar uma parede faz você reaparecer do lado oposto!",
      visualSnippet: (
        <div className="tutorial-visual-box visual-step-2">
          <div className="controls-preview">
            <span className="key-cap">W / ▲</span>
            <div className="key-row">
              <span className="key-cap">A / ◀</span>
              <span className="key-cap">S / ▼</span>
              <span className="key-cap">D / ▶</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      badge: "Passo 3 de 5",
      icon: "🍏",
      title: "A Maçã Abre a Afirmação",
      subtitle: "Pausa automática e 15 segundos para pensar",
      description:
        "Ao comer a maçã, o movimento da cobrinha pausa imediatamente e surge um balão sobre o tabuleiro. Você tem 15 segundos para ler a afirmação e posicionar seu palpite na barra deslizante. Se o tempo zerar, o palpite atual é confirmado sozinho.",
      visualSnippet: (
        <div className="tutorial-visual-box visual-step-3">
          <div className="timer-preview">
            <span className="timer-badge">⏳ 15 segundos</span>
            <span className="auto-confirm-text">Auto-confirma ao esgotar o tempo</span>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      badge: "Passo 4 de 5",
      icon: "⚖️",
      title: "Barra de Confiabilidade",
      subtitle: "De 0% a 100% com margem de 15 pontos",
      description:
        "Ajuste o cursor de 0% ('Nada confiável') a 100% ('Totalmente confiável'). Ao confirmar, a barra revela seu palpite e a referência científica oficial. Palpites com até 15 pontos de distância da referência contam como acerto e rendem pontuação máxima (+100 pontos)!",
      visualSnippet: (
        <div className="tutorial-visual-box visual-step-4">
          <div className="mini-slider-track">
            <div className="mini-marker-you" style={{ left: "45%" }}>
              <span>Você (45%)</span>
            </div>
            <div className="mini-marker-ref" style={{ left: "50%" }}>
              <span>Ref (50%)</span>
            </div>
          </div>
          <span className="mini-dist-info">Diferença de 5 pontos = Acerto! 🎯</span>
        </div>
      ),
    },
    {
      id: 5,
      badge: "Passo 5 de 5",
      icon: "🐍",
      title: "A Cobra Só Cresce no Erro!",
      subtitle: "Acertos mantêm seu tamanho seguro",
      description:
        "Ao contrário de outros jogos, aqui a cobra NÃO cresce ao comer a maçã! Ela só cresce 1 quadrado quando você erra a pergunta (> 15 pontos longe da referência). Quanto mais você erra, mais difícil fica manobrar sem bater no próprio corpo. Complete 6 níveis para vencer!",
      visualSnippet: (
        <div className="tutorial-visual-box visual-step-5">
          <div className="growth-preview">
            <span className="growth-tag tag-success">Acerto: Cobra não cresce ✅</span>
            <span className="growth-tag tag-danger">Erro: Cobra cresce +1 ⚠️</span>
          </div>
        </div>
      ),
    },
  ];

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="tutorial-page">
      <div className="tutorial-container">
        {/* Barra Superior do Tutorial */}
        <div className="tutorial-topbar">
          <span className="tutorial-badge-step">{step.badge}</span>
          <button
            type="button"
            className="skip-button"
            onClick={onSkip}
            title="Pular para o jogo"
          >
            Pular Tutorial ✕
          </button>
        </div>

        {/* Card Principal do Passo Atual */}
        <div className="tutorial-card">
          <div className="tutorial-header">
            <span className="tutorial-step-icon" aria-hidden="true">{step.icon}</span>
            <h2 className="tutorial-title">{step.title}</h2>
            <p className="tutorial-subtitle">{step.subtitle}</p>
          </div>

          {step.visualSnippet}

          <p className="tutorial-body-text">{step.description}</p>
        </div>

        {/* Indicadores de Progresso (Dots) */}
        <div className="step-dots" role="tablist" aria-label="Passos do tutorial">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={idx === currentStep}
              className={`step-dot ${idx === currentStep ? "active" : ""}`}
              onClick={() => setCurrentStep(idx)}
              title={`Ir para o passo ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="tutorial-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handlePrev}
            disabled={isFirst}
          >
            ◀ Anterior
          </button>

          <button
            type="button"
            className="action-button next-button"
            onClick={handleNext}
            autoFocus
          >
            {isLast ? "Começar a Jogar 🚀" : "Próximo Passo ➔"}
          </button>
        </div>
      </div>
    </div>
  );
};
