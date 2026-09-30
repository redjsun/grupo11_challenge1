# FAKO — Jogo Educativo de Checagem de Fatos (Snake)

O **FAKO** transforma a clássica mecânica do Snake (jogo da cobrinha) em uma ferramenta educativa para treinar a análise crítica e o combate à desinformação. O jogador guia a cobrinha pelo tabuleiro, coleta maçãs e avalia a confiabilidade de afirmações reais sobre Saúde, Tecnologia e Conhecimentos Gerais.

---

## 🎯 Mecânicas do Jogo

- **Tabuleiro em Grade 16x16:** Renderizado em `<canvas>` com suporte a displays Retina/High-DPI e design em tons de verde xadrez.
- **Bordas Conectadas (Torus):** A cobrinha atravessa as paredes e reaparece no lado oposto do tabuleiro.
- **Olhos Direcionais:** Os olhos da cobrinha acompanham ativamente a direção do movimento.
- **A Maçã Pausa o Jogo:** Ao comer a maçã, o jogo pausa e abre um balão de pergunta/afirmação sobre o tabuleiro.
- **Crescimento Apenas no Erro:** A cobrinha **não** cresce ao comer a maçã! Ela só cresce 1 segmento quando o jogador erra a avaliação da pergunta (> 15 pontos de distância da referência).
- **Fim de Jogo:** Quando a cobrinha colide com o próprio corpo.
- **Progressão em 6 Níveis:** A cada 10 maçãs coletadas e respondidas, o jogador avança de nível. A subida de nível é silenciosa (apenas atualiza o placar no cabeçalho). Completar o nível 6 é a condição de vitória.

---

## ⚖️ Sistema de Perguntas e Avaliação

1. **Afirmação e Categoria:** Cada maçã traz uma afirmação categorizada (*Saúde*, *Tecnologia* ou *Conhecimentos Gerais*).
2. **Tempo Limite de 15 Segundos:** Cronômetro regressivo com alerta visual e sonoro nos últimos 5 segundos. Caso o tempo se esgote, o palpite atual é confirmado automaticamente.
3. **Barra Deslizante (0% a 100%):** Passo de 5%, começando em 50% ("Nada confiável" a "Totalmente confiável").
4. **Revelação e Comparação:** Ao confirmar, a barra revela dois marcadores visuais:
   - **Você:** O palpite selecionado pelo jogador.
   - **Referência:** A taxa oficial calculada por especialistas/ciência.
5. **Critério de Pontuação:**
   - **Distância ≤ 15 pontos (Acerto):** Pontuação cheia (+100 pontos, com bônus de 120 para acerto exato). A cobrinha **não** cresce.
   - **Distância > 15 pontos (Erro):** 0 pontos. A cobrinha cresce 1 quadrado no próximo passo.
6. **Explicação e Fontes:** Apresenta justificativa pedagógica e fontes de órgãos oficiais (OMS, Fiocruz, Cochrane, EFF, NIST, NASA, etc.).

---

## 🎮 Controles

- **Teclado:** Setas direcionais ou teclas `W`, `A`, `S`, `D`.
- **Atalhos de Ação:** Tecla `Enter` confirma o palpite e avança as telas; barra de `Espaço` também retoma o jogo.
- **Celular / Toque:**
  - Botões virtuais na tela (D-pad direcional).
  - Gestos de deslize (*swipe*) diretamente sobre o tabuleiro.
- **Tema:** Alternância automática (claro/escuro) conforme o sistema operacional ou manual via botão `☀️ / 🌙 / 🌓`.
- **Efeitos Sonoros:** Sintetizados diretamente via Web Audio API (sem dependências externas de áudio ou rede), com botão para mutar/desmutar (`🔊 / 🔇`).

---

## 🏗️ Arquitetura e Modelo de Dados

### Modelo de Cada Pergunta
```typescript
interface Question {
  categoria: "Saúde" | "Tecnologia" | "Conhecimentos Gerais";
  afirmacao: string;
  confiabilidade_referencia: number; // 0 a 100
  explicacao: string;
  fonte?: string;
}
```

### Isolamento da Função `nextQuestion()`
A busca pela próxima pergunta está isolada em `src/services/questionService.ts`. No futuro, essa função pode ser substituída diretamente por uma chamada a uma API REST (`GET /api/questions/next`) ou banco de dados, sem alterar nenhuma lógica do jogo.

---

## 🚀 Como Executar

### Opção 1: Direto no Navegador (Sem Instalação)
Basta abrir o arquivo [`index.html`](./index.html) na raiz do repositório diretamente em qualquer navegador moderno (Chrome, Safari, Firefox, Edge).

```bash
open index.html
```

### Opção 2: Projeto React + Vite
Na pasta `web`:

```bash
cd web
npm install
npm run dev
```

Acesse em: `http://localhost:5173/`

### Opção 3: Docker Compose
```bash
docker compose up
# ou
make up
```

- Frontend: `http://localhost:5173`
- Backend API (FastAPI): `http://localhost:8000`
