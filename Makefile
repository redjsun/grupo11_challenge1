COMPOSE := docker compose

.PHONY: help build up down restart logs ps shell-api shell-web clean

help: ## Lista os comandos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

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

clean: ## Remove containers, volumes e imagens do projeto
	$(COMPOSE) down -v --rmi local
