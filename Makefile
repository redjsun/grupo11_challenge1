COMPOSE := docker compose

.PHONY: help build up down restart logs ps shell-api shell-web shell-db migrate makemigration seed admin clean

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

build: ## Constrói as imagens do projeto
	$(COMPOSE) build

up: ## Sobe os containers em background
	$(COMPOSE) up -d

down: ## Derruba os containers
	$(COMPOSE) down

restart: down up ## Reinicia os containers

logs: ## Acompanha os logs dos serviços
	$(COMPOSE) logs -f

ps: ## Mostra o status dos containers
	$(COMPOSE) ps

shell-api: ## Abre um shell no container da API
	$(COMPOSE) exec api bash

shell-web: ## Abre um shell no container do frontend
	$(COMPOSE) exec web sh

shell-db: ## Abre o psql no container do banco
	$(COMPOSE) exec db psql -U fako -d fako

migrate: ## Aplica as migrations pendentes no banco
	$(COMPOSE) exec api alembic upgrade head

makemigration: ## Gera uma migration a partir dos models (uso: make makemigration m="descricao")
	$(COMPOSE) exec api alembic revision --autogenerate -m "$(m)"

seed: ## Popula o banco com categorias, níveis e questões iniciais
	$(COMPOSE) exec api python -m app.seeds.run

admin: ## Cria um administrador de conteúdo (uso: make admin u=usuario p=senha)
	$(COMPOSE) exec api python -m app.seeds.create_admin "$(u)" "$(p)"

clean: ## Remove containers, volumes e imagens do projeto
	$(COMPOSE) down -v --rmi local
