# Planejamento: coleta contínua e retreino do classificador

> **Status: planejado, não implementado.** Depende de termos o primeiro modelo treinado
> e avaliado (`ml/treinar.py` e `ml/avaliar.py` ainda não existem).

## Por que retreinar

As fake news acompanham o noticiário: cada época tem seus personagens, golpes e
assuntos. Um modelo treinado até certa data não conhece o vocabulário que aparece
depois, e a precisão cai aos poucos (*drift*). O split temporal da base (treino de 2016 a
2023, validação em 2024 e teste de 2025 em diante, ver `scripts/preparar_dados.py`)
mede essa queda. É ele que define a frequência:

- queda pequena no teste temporal: retreinar a cada 3–6 meses;
- queda grande: retreinar todo mês, com as checagens novas.

Classificar é diferente de retreinar. A classificação das notícias novas é leve e pode
ser diária ou a cada requisição da API. O retreino é periódico.

## Decisão: supercronic no compose

Um container de agendamento no `compose.yaml` com o [supercronic](https://github.com/aptible/supercronic),
um cron feito para containers (binário de poucos MB, ~10–30 MB de RAM, sem banco nem
interface). Ele roda os scripts que já existem, nos horários de um arquivo `crontab`.

Alternativas consideradas:

| Opção | Por que não, por enquanto |
|---|---|
| Airflow | 4+ containers e centenas de MB a GB de RAM para um fluxo de poucas etapas |
| Prefect / Dagster | mais leves que o Airflow, mas ainda são um serviço a mais para manter |
| cron do host / Agendador de Tarefas do Windows | a configuração fica presa a uma máquina |
| GitHub Actions agendado | o cache de `data/` não persiste entre execuções |

Se o projeto crescer, a migração para um orquestrador é direta: cada linha do
`crontab` vira uma tarefa de DAG.

## Desenho

```
diário   coletar_factcheck ─┐
         coletar_verdadeiras┼─> (dados novos em data/raw/, incremental pelo cache)
         coletar_boatos ────┘

mensal   preparar_dados ─> treinar ─> avaliar ─┬─> publicar em models/ (se melhor)
                                               └─> manter o modelo atual (se pior)
```

Rascunho do `ml/crontab`:

```cron
# coleta incremental diária (só baixa o que é novo, graças ao cache)
0 3 * * *  python scripts/coletar_factcheck.py && python scripts/coletar_verdadeiras.py --de $(date +%Y-%m)
# retreino mensal, no dia 1, com portão de qualidade
0 5 1 * *  python scripts/preparar_dados.py && python ml/treinar.py && python ml/avaliar.py --publicar-se-melhor
```

Rascunho do serviço no `compose.yaml`:

```yaml
  agendador:
    build: ./notebooks          # mesmo ambiente Python da EDA e do treino
    command: supercronic /work/ml/crontab
    env_file: .env              # FACTCHECK_API_KEY
    volumes:
      - ./scripts:/work/scripts
      - ./ml:/work/ml
      - ./data:/work/data
      - ./models:/work/models   # a API lê o modelo publicado daqui
    restart: unless-stopped
```

A imagem precisa ganhar o binário do supercronic no `Dockerfile`.

## Requisitos para implementar

1. **Portão de qualidade.** O modelo novo só substitui o atual se não for pior num
   conjunto recente que nenhum dos dois viu no treino. Sem isso, um retreino com dados
   ruins piora o produto sem ninguém notar.
2. **Versionamento.** Cada modelo em `models/AAAA-MM/`, com `metricas.json` (dados
   usados, métricas por split e por fonte), para poder comparar e voltar atrás. A API
   lê o modelo publicado (por exemplo `models/atual`).
3. **Monitoramento.** Registrar a proporção de previsões *fake* por dia. Uma mudança
   brusca indica *drift* ou que alguma fonte mudou de formato.
4. **Coleta incremental.** `coletar_verdadeiras.py --de AAAA-MM` já limita o período.
   Falta o mesmo no `coletar_factcheck.py` (hoje ele percorre todas as páginas de cada
   agência) e no `coletar_boatos.py` (sitemap só do ano corrente).
5. **Mesmo formato no treino e no uso.** Se o modelo for treinado com `texto_curto`
   (título ou alegação), a classificação diária também usa o título.

## Ordem

1. Fechar a EDA (`notebooks/eda_1_datasets.ipynb` e `notebooks/eda_2_conjunto.ipynb`).
2. Treinar e avaliar o primeiro modelo (`ml/`), medindo a queda no teste temporal.
3. Com essa medida, definir a frequência e implementar o agendador.
