import React, { useState } from "react";
import { authService } from "../services/authService";
import { User } from "../types";

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        const result = await authService.login(username, password);
        if (result.success && result.user) {
          onLoginSuccess(result.user);
        } else {
          setError(result.error || "Erro ao realizar login.");
        }
      } else {
        const result = await authService.register(username, password);
        if (result.success && result.user) {
          onLoginSuccess(result.user);
        } else {
          setError(result.error || "Erro ao criar conta.");
        }
      }
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* Banner Ilustrativo Verde (estilo Figma) */}
        <div className="auth-banner">
          <div className="banner-badge">🍏 FAKO Game</div>
          <h2 className="banner-title">Jogue.<br />Analise.<br />Aprenda.</h2>
          <p className="banner-description">
            Treine sua mente para checar fatos e combater fake news enquanto domina a mecânica ágil da cobrinha.
          </p>

          <div className="banner-snake-card" aria-hidden="true">
            <div className="mini-board">
              <div className="mini-snake-head">
                <div className="mini-eye"></div>
                <div className="mini-eye"></div>
              </div>
              <div className="mini-snake-body"></div>
              <div className="mini-snake-body"></div>
              <div className="mini-apple">🍏</div>
            </div>
            <span className="mini-caption">100% de fatos validados</span>
          </div>
        </div>

        {/* Card do Formulário */}
        <div className="auth-form-card">
          <div className="auth-form-header">
            <div className="auth-logo-row">
              <span className="auth-logo-icon">🍏</span>
              <h1 className="auth-logo-text">FAKO</h1>
            </div>
            <p className="auth-subtitle">
              {mode === "login"
                ? "Entre para continuar sua jornada de checagem"
                : "Crie seu usuário para começar a jogar"}
            </p>
          </div>

          {/* Abas Entrar / Criar Conta */}
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => handleToggleMode("login")}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => handleToggleMode("register")}
            >
              Criar conta
            </button>
          </div>

          {/* Banner de Erro */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="auth-username" className="form-label">
                Nome de usuário
              </label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">👤</span>
                <input
                  id="auth-username"
                  type="text"
                  className="form-input"
                  placeholder="Ex: cobrinha_curiosa"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="auth-password" className="form-label">
                Senha
              </label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">🔒</span>
                <input
                  id="auth-password"
                  type="password"
                  className="form-input"
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="action-button auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                "Carregando..."
              ) : mode === "login" ? (
                "Entrar no FAKO ➔"
              ) : (
                "Criar Conta e Começar 🚀"
              )}
            </button>
          </form>

          {/* Alternância de Modo */}
          <div className="auth-footer-prompt">
            {mode === "login" ? (
              <p>
                Ainda não tem conta?{" "}
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => handleToggleMode("register")}
                >
                  Criar conta grátis
                </button>
              </p>
            ) : (
              <p>
                Já possui uma conta?{" "}
                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => handleToggleMode("login")}
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
