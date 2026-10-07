import React, { useState } from "react";
import { CategoryFilter } from "../types";

interface CategoriesScreenProps {
  onSelectCategory: (cat: CategoryFilter) => void;
  onBack: () => void;
}

interface CategoryOption {
  id: CategoryFilter;
  title: string;
  badge: string;
  badgeClass: string;
  icon: string;
  desc: string;
  highlight?: boolean;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  onSelectCategory,
  onBack,
}) => {
  const [selected, setSelected] = useState<CategoryFilter>("Misto");

  const categories: CategoryOption[] = [
    {
      id: "Misto",
      title: "Desafio Completo (Misto)",
      badge: "Recomendado",
      badgeClass: "badge-green",
      icon: "🎲",
      desc: "Todas as categorias embaralhadas aleatoriamente. O formato oficial do campeonato FAKO!",
      highlight: true,
    },
    {
      id: "Saúde",
      title: "Saúde & Bem-Estar",
      badge: "15 Afirmações",
      badgeClass: "badge-green",
      icon: "🌿",
      desc: "Mitos e fatos sobre vitaminas, sono, remédios caseiros, nutrição e imunidade.",
    },
    {
      id: "Tecnologia",
      title: "Tecnologia & Segurança",
      badge: "15 Afirmações",
      badgeClass: "badge-blue",
      icon: "💻",
      desc: "Segurança digital, aba anônima, senhas seguras, HTTPS e privacidade no celular.",
    },
    {
      id: "Conhecimentos Gerais",
      title: "Conhecimentos Gerais",
      badge: "15 Afirmações",
      badgeClass: "badge-amber",
      icon: "🌍",
      desc: "Mitos históricos, ciência, neurociência, meio ambiente e geografia.",
    },
  ];

  return (
    <div className="categories-page">
      <div className="categories-container">
        {/* Barra Superior */}
        <div className="categories-topbar">
          <button type="button" className="secondary-button" onClick={onBack}>
            ← Voltar
          </button>
          <span className="categories-badge">🏷️ Categorias</span>
        </div>

        <div className="categories-header-card">
          <h2 className="categories-title">Escolha seu Treino</h2>
          <p className="categories-subtitle">
            Selecione uma área temática para praticar ou jogue no modo misto com todas as perguntas.
          </p>
        </div>

        {/* Grid de 4 Categorias (Figma Screen 3) */}
        <div className="categories-grid">
          {categories.map((cat) => {
            const isSelected = selected === cat.id;
            return (
              <div
                key={cat.id}
                className={`category-select-card ${isSelected ? "selected" : ""} ${
                  cat.highlight ? "highlight-card" : ""
                }`}
                onClick={() => setSelected(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(cat.id)}
              >
                <div className="cat-card-top">
                  <span className="cat-card-icon">{cat.icon}</span>
                  <span className={`cat-card-badge ${cat.badgeClass}`}>{cat.badge}</span>
                </div>
                <h3 className="cat-card-title">{cat.title}</h3>
                <p className="cat-card-desc">{cat.desc}</p>
                <div className="cat-card-radio">
                  <span className={`radio-dot ${isSelected ? "checked" : ""}`} />
                  <span className="radio-label">
                    {isSelected ? "Selecionado para jogar" : "Toque para escolher"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="action-button start-category-btn"
          onClick={() => onSelectCategory(selected)}
        >
          Iniciar com {selected === "Misto" ? "Desafio Misto" : selected} ➔
        </button>
      </div>
    </div>
  );
};
