import React from "react";
import { Direction } from "../types";

interface DpadControlsProps {
  onDirectionChange: (dir: Direction) => void;
  disabled?: boolean;
}

export const DpadControls: React.FC<DpadControlsProps> = ({
  onDirectionChange,
  disabled = false,
}) => {
  const handlePress = (dir: Direction) => {
    if (disabled) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignora
      }
    }
    onDirectionChange(dir);
  };

  return (
    <div className="dpad-container" aria-label="Controles direcionais na tela">
      <div className="dpad-grid">
        <button
          type="button"
          className="dpad-btn dpad-up"
          onClick={() => handlePress("UP")}
          disabled={disabled}
          aria-label="Mover para cima"
        >
          ▲
        </button>
        <button
          type="button"
          className="dpad-btn dpad-left"
          onClick={() => handlePress("LEFT")}
          disabled={disabled}
          aria-label="Mover para esquerda"
        >
          ◀
        </button>
        <div className="dpad-center" aria-hidden="true">
          <div className="dpad-nub" />
        </div>
        <button
          type="button"
          className="dpad-btn dpad-right"
          onClick={() => handlePress("RIGHT")}
          disabled={disabled}
          aria-label="Mover para direita"
        >
          ▶
        </button>
        <button
          type="button"
          className="dpad-btn dpad-down"
          onClick={() => handlePress("DOWN")}
          disabled={disabled}
          aria-label="Mover para baixo"
        >
          ▼
        </button>
      </div>
      <p className="dpad-hint">
        Dica: você também pode usar <strong>Setas / WASD</strong> ou <strong>deslizar o dedo (swipe)</strong> no tabuleiro.
      </p>
    </div>
  );
};
