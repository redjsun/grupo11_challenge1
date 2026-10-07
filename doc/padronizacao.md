# Padronização do texto curto pela LLM (issue #20)

> **Status:** o lote e o cache estão em `pesquisa/ml/padronizar.py`. Faltam o prompt de extração
> (#19), a leitura do cache em `pesquisa/ml/dados.py` (#7) e a comparação pelo teste de atalho (#8).

## Por quê

Em uso, o classificador recebe afirmações extraídas pela LLM do texto do usuário. No
treino, o `texto_curto` é uma manchete nos verdadeiros e uma alegação de checador nos
falsos. Treinado num formato e usado em outro, o modelo erra sem aviso, e a forma do
texto já separa as classes (AUC macro de ~0,64 no teste de atalho na validação e no teste).
Passar o treino pelo **mesmo prompt** do uso põe as duas classes no mesmo formato.

## Como roda

```bash
make padronizar ARGS="--limite 50"   # amostra, com api/app/prompts/extrair_afirmacoes_v1.txt
make padronizar ARGS="--paralelo 8"  # lote todo; outra versão: PROMPT=api/app/prompts/..._v2.txt
```

- **Entrada:** todos os registros de `pesquisa/data/processed/dataset.jsonl`, de todos os splits. Usa
  o `texto_curto`; sem ele (Fake.br, verdadeiras do FakeTrue.Br, a maior parte das
  mensagens), usa o `texto`.
- **Prompt:** o arquivo `api/app/prompts/extrair_afirmacoes_vN.txt` da #19, o mesmo do
  uso. O texto do registro entra no marcador `{texto}` (ou no fim, se o prompt não tiver o
  marcador). A resposta segue o esquema da #19, `{"e_opiniao": ..., "afirmacoes":
  [{"texto": ..., "quem_disse": ...}]}`; lista vazia quer dizer opinião. O cache guarda o
  `quem_disse`, mas o treino usa só o `texto`, como o classificador em uso.
- **LLM:** o **Qwen hospedado**, o mesmo da coleta diária de notícias: treino e uso precisam
  do mesmo prompt **e** do mesmo modelo, senão o formato volta a divergir. Endpoint
  compatível com a API de chat da OpenAI, por `LLM_BASE_URL`, `LLM_MODEL` (com a versão
  fixa, porque provedores atualizam modelos sem aviso) e `LLM_API_KEY` no `.env`.
  Temperatura 0; o pedido leva o JSON Schema da #19 em `response_format` (`--sem-esquema`
  se o provedor não aceitar) e o texto truncado em `--max-caracteres` (padrão 16 mil, ~4 mil
  tokens). `LLM_EXTRA_BODY` passa opções do provedor, como desligar o raciocínio do Qwen3.
  Erros 429 e 5xx e falhas de rede ganham até 4 tentativas, com espera de 2, 4 e 8 s.
- **Escolha do modelo:** 2 a 3 tamanhos de Qwen comparados nos 100 textos BR da #19
  (opinião, checabilidade, `quem_disse`, % de JSON válido, tempo e custo por texto), antes do
  lote. Os textos saem da máquina: só bases públicas e notícias, nunca dados de jogadores;
  conferir nos termos do provedor que as entradas não são usadas para treino.
- **Cache:** `pesquisa/data/processed/padronizado_<versao>.jsonl` (fora do Git), uma linha por `id`
  com as afirmações, a versão, o hash do prompt e o modelo. Trocar o modelo também refaz as
  linhas. A versão vem do nome do arquivo. Rodar
  de novo só processa os ids que faltam (nos retreinos, só as frases novas). Se o texto
  do prompt mudar sem trocar a versão, o hash não bate e as linhas antigas são refeitas.
  Cada linha é gravada ao ficar pronta: dá para interromper e retomar. Falhas da LLM
  (rede, timeout, resposta fora do formato) não entram no cache e são refeitas na próxima
  rodada.
- **Custo:** cada rodada acrescenta o tempo, o número de chamadas e os tokens (quando o
  endpoint informa) em `padronizado_<versao>.rodadas.jsonl`.

## Regra para várias afirmações ou nenhuma

Decisão: **o cache guarda todas as afirmações**, e `aplicar()` (que `pesquisa/ml/dados.py` vai
chamar) gera dois campos:

| Caso | `texto_padronizado` | `n_afirmacoes` | No treino de frases curtas |
|---|---|---|---|
| uma afirmação | a afirmação | 1 | entra |
| várias | a primeira | quantas vieram | entra, com a primeira |
| nenhuma (opinião) | `None` | 0 | sai |
| não processado | `None` | `None` | sai |

A primeira afirmação tende a ser a principal (é a da manchete ou do início do texto).
Descartar as opiniões evita ensinar `falso` ou `verdadeiro` a quem não afirma nada; elas
podem servir depois à cabeça de tipo (`opiniao`). Como o cache guarda a lista inteira,
mudar a regra (usar todas as afirmações, por exemplo) não exige chamar a LLM de novo.

## Como validar (depende de #7 e #8)

1. Treinar os modelos de referência nas duas versões, `texto_curto` original e
   `texto_padronizado`, com os mesmos splits.
2. Comparar F1 macro na validação, no conjunto todo e na fatia "só checados".
3. Rodar o teste de atalho nas duas versões (`make atalho ARGS="--prompt ..."`): o AUC
   deve **cair** na padronizada, comparada ao original nos mesmos registros.
4. Registrar aqui as duas tabelas e o tempo e custo do lote (de `*.rodadas.jsonl`).

| Versão | F1 validação | F1 só checados | AUC atalho validação | AUC atalho teste |
|---|---|---|---|---|
| original | – | – | ~0,64 | ~0,64 |
| padronizado | – | – | – | – |

| Lote | Modelo | Itens | Tempo | Tokens | Custo |
|---|---|---|---|---|---|
| – | – | – | – | – | – |
