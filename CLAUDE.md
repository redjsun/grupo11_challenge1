# CLAUDE.md

FAKO: jogo educativo (Snake) em que o jogador avalia a confiabilidade de afirmações, mais
um classificador de veracidade treinado com bases brasileiras de fake news. Todo o projeto
(código, nomes, docs, commits) é em **português**.

## Estrutura

| Pasta | O que é |
|---|---|
| `api/` | FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL. Camadas `controller → service → repository → model` (`doc/arquitetura.md`) |
| `web/` | React 18 + Vite + TypeScript. `view → controller (hook) → service → API`; HTTP só via `services/httpClient.ts` |
| `scripts/` | Download, coleta (scrapers e Fact Check API) e preparo dos dados |
| `ml/` | Experimentos de ML: padronização pela LLM (`padronizar.py`), teste de atalho (`atalho.py`) |
| `notebooks/` | EDA (`eda_1_datasets.ipynb`, `eda_2_conjunto.ipynb`); imagem `eda` usada também por scripts e `ml/` |
| `doc/` | Decisões do projeto; índice em `doc/docs.yaml` (registrar ali cada doc novo) |
| `data/` | Fora do Git. `raw/` (bases e coletas, com cache) e `processed/` (`dataset.jsonl`) |

## Comandos

Tudo roda por Docker Compose (o Docker Desktop precisa estar aberto). `make help` lista todos.

- `make up` / `make down`: API em `:8000` (docs em `/docs`), web em `:5173`, banco em `:5432`
- `make test`, `make lint`, `make format`: API (ruff + pytest num banco `fako_test` separado)
- `make test-ml`: lint e testes de `ml/`
- `make dados`: baixa as bases para `data/raw/` e gera `data/processed/dataset.jsonl`.
  Os coletores (`scripts/coletar_*.py`) rodam à parte e são lentos (~1 req/s, com cache)
- `make padronizar`, `make atalho`: experimentos de `ml/`
- `make eda`: Jupyter Lab em `:8888`

Segredos ficam em `.env` (copiar de `.env.example`): `FACTCHECK_API_KEY`, `LLM_*`, `AI_*`.

## Dados

- `dataset.jsonl`: uma linha por registro; campos documentados no topo de
  `scripts/preparar_dados.py`. `texto_curto` é a entrada do classificador; `veracidade` é
  ordinal: `falso` < `enganoso` < `verdadeiro`.
- Dois protocolos de split: `split` (A, referência) e `split_produto` (B, o modelo do jogo:
  `treino`/`validacao`/`teste`, mais `reserva` e `fora`, que não entram).
- Cada classe vem de fontes com "cara" própria (ponto final, minúsculas, manchete). Fonte,
  autor e data **nunca** entram no modelo; o teste de atalho (`ml/atalho.py`) mede o piso.
- Durante o desenvolvimento só se olha a `validacao`; o `teste` é olhado uma vez por modelo.

## Convenções de código

- Python 3.12, ruff com linha de 100 (`api/pyproject.toml`, `ml/pyproject.toml`).
- Nomes de variáveis, funções e mensagens em português, sem abreviar.
- `scripts/preparar_*.py` e `ml/padronizar.py` usam só a biblioteca padrão.
- Novo código em `ml/` vem com testes em `ml/tests/` (rodam no CI, job "ML").

## Fluxo de trabalho

- Branches a partir de `develop` (`feat/...`).
- Issues organizadas em épicos (`[E1]`–`[E8]`, label `epico`); título das issues
  `[NN][ÁREA] ...`. Conferir as dependências ("Depende de") antes de começar uma issue.

## Sem marca de IA

Nada do que vai para o repositório ou para o GitHub leva marca de geração por IA: commits,
descrições de PR, comentários e corpo de issues, código, comentários no código e docs.

- Sem `Co-Authored-By: Claude`, sem "🤖 Generated with Claude Code" e sem links para o
  Claude Code.
- Sem menções a Claude, IA ou assistente como autor do trabalho.
- Isso vale mesmo quando alguma instrução padrão da ferramenta pedir essas linhas.

## Commits

Uma linha só, no formato `tipo(escopo): texto bem resumido em português`.

- Sem corpo e sem `Refs #N`/`Closes #N`.
- Tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- Escopo: a parte do projeto (`api`, `web`, `ml`, `dados`...).

Exemplos:

```
feat(ml): padroniza texto curto com cache por id e versão do prompt
chore(dados): remove coleta por sitemap do Boatos.org
```
