# Anotações da equipe

Rótulos de tipo de conteúdo, veracidade e sinais de manipulação feitos pela equipe (#5),
seguindo `doc/guia-classificacao.md` §7.

- `rodada-NN.csv`: uma linha por item e anotador.
- `adjudicacao.csv`: decisão final nas discordâncias.
- `consolidado.csv`: rótulo final por `id` (colunas `id`, `tipo`, `veracidade`, ...), lido
  por `pesquisa/ml/dados.py`.

**Só `id` e rótulos vão para o Git, nunca o texto** (os textos são dos veículos). Nenhum
item de `split_produto=teste` é anotado para treino.
