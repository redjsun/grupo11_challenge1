# CLAUDE.md

FAKO: jogo educativo (Snake) em que o jogador avalia a confiabilidade de afirmações, mais
um classificador de veracidade treinado com bases brasileiras de fake news. Todo o projeto
(código, nomes, docs, commits) é em **português**.

## Estrutura

| Pasta | O que é |
|---|---|
| `api/` | FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL. Camadas `controller → service → repository → model` (`doc/arquitetura.md`) |
| `web/` | React 18 + Vite + TypeScript. `view → controller (hook) → service → API`; HTTP só via `services/httpClient.ts` |
| `pesquisa/` | Tudo de dados e treinamento. Imagem e serviço `pesquisa` no compose (`Dockerfile`, `requirements.txt`) |
| `pesquisa/dados/` | Download, coleta (scrapers e Fact Check API) e preparo dos dados |
| `pesquisa/ml/` | Experimentos de ML: padronização pela LLM (`padronizar.py`), teste de atalho (`atalho.py`) |
| `pesquisa/notebooks/` | EDA (`eda_1_datasets.ipynb`, `eda_2_conjunto.ipynb`) |
| `pesquisa/data/` | Fora do Git. `raw/` (bases e coletas, com cache) e `processed/` (`dataset.jsonl`) |
| `doc/` | Todos os docs do projeto, inclusive os de pesquisa; índice em `doc/docs.yaml` (registrar ali cada doc novo) |

## Comandos

Tudo roda por Docker Compose (o Docker Desktop precisa estar aberto). `make help` lista todos.

- `make up` / `make down`: API em `:8000` (docs em `/docs`), web em `:5173`, banco em `:5432`
- `make test`, `make lint`, `make format`: API (ruff + pytest num banco `fako_test` separado)
- `make test-ml`: lint e testes de `pesquisa/ml/`
- `make dados`: baixa as bases para `pesquisa/data/raw/` e gera `pesquisa/data/processed/dataset.jsonl`.
  Os coletores (`pesquisa/dados/coletar_*.py`) rodam à parte e são lentos (~1 req/s, com cache)
- `make padronizar`, `make atalho`: experimentos de `pesquisa/ml/`
- `make eda`: Jupyter Lab em `:8888`

Segredos ficam em `.env` (copiar de `.env.example`): `FACTCHECK_API_KEY`, `LLM_*`, `AI_*`.

## Dados

- `dataset.jsonl`: uma linha por registro; campos documentados no topo de
  `pesquisa/dados/preparar_dados.py`. `texto_curto` é a entrada do classificador; `veracidade` é
  ordinal: `falso` < `enganoso` < `verdadeiro`.
- Dois protocolos de split: `split` (A, referência) e `split_produto` (B, o modelo do jogo:
  `treino`/`validacao`/`teste`, mais `reserva` e `fora`, que não entram).
- Cada classe vem de fontes com "cara" própria (ponto final, minúsculas, manchete). Fonte,
  autor e data **nunca** entram no modelo; o teste de atalho (`pesquisa/ml/atalho.py`) mede o piso.
- Durante o desenvolvimento só se olha a `validacao`; o `teste` é olhado uma vez por modelo.

## Convenções de código

- Python 3.12, ruff com linha de 100 (`api/pyproject.toml`, `pesquisa/ml/pyproject.toml`).
- Nomes de variáveis, funções e mensagens em português, sem abreviar.
- `pesquisa/dados/preparar_*.py` e `pesquisa/ml/padronizar.py` usam só a biblioteca padrão.
- Na pesquisa, a raiz dos caminhos é `pesquisa/` (`RAIZ = Path(__file__).parent.parent`);
  os comandos rodam a partir da raiz do repositório, no host e no container.
- Novo código em `pesquisa/ml/` vem com testes em `pesquisa/ml/tests/` (rodam no CI, job "ML").

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
