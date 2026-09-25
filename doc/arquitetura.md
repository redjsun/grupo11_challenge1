# Arquitetura

O projeto segue **arquitetura em camadas + MVC**, com a mesma ideia aplicada no
backend e no frontend: cada camada só conhece a camada imediatamente abaixo.

## Backend (`api/`)

```
app/
├── main.py           # composição da aplicação (monta app e rotas)
├── core/             # configuração e infraestrutura
├── controllers/      # Controller — rotas HTTP, validação de entrada
├── services/         # regras de negócio, sem conhecer HTTP
├── repositories/     # acesso a dados
├── models/           # Model — entidades de domínio (SQLAlchemy)
├── schemas/          # DTOs de entrada e saída da API
└── seeds/            # dados iniciais (categorias, níveis, questões)
migrations/           # migrations do Alembic, geradas a partir dos models
```

Persistência: PostgreSQL (serviço `db` no compose), SQLAlchemy 2 e Alembic.
`core/database.py` abre uma sessão por requisição (`get_db`), com commit ao
final e rollback em caso de erro. Comandos: `make migrate`, `make makemigration m="..."`
e `make seed`.

Segurança: senhas com hash bcrypt (`core/security.py`) e autenticação por JWT no
header `Authorization: Bearer`. `core/deps.py` expõe `get_current_user` e
`get_current_admin` para proteger as rotas. Variáveis de ambiente em `.env.example`.

Fluxo: `controller → service → repository → model`.
Os `schemas` trafegam entre controller e service; os `models` não vazam para fora
da camada de negócio.

## Frontend (`web/src/`)

```
src/
├── models/        # Model — tipos do domínio
├── services/      # acesso à API (httpClient + serviços por recurso)
├── controllers/   # Controller — hooks que orquestram estado e serviços
└── views/         # View — páginas e componentes de apresentação
    ├── pages/
    └── components/
```

Fluxo: `view → controller (hook) → service → API`.
As views não chamam `fetch` diretamente; toda chamada HTTP passa pelo
`services/httpClient.ts`.
