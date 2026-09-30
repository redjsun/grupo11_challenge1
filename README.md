# Desafio Fake News - TIC

Repositório dedicado ao desafio de fake news do TIC.

## Dados

As bases não ficam no Git: `data/` está no `.gitignore`. Para baixá-las e gerar a
versão unificada:

```bash
make dados    # data/raw/ (brutos) + data/processed/dataset.jsonl
make eda      # Jupyter Lab com notebooks/eda.ipynb em http://localhost:8888
```

Sem `make`: `bash scripts/baixar_dados.sh` e depois `python scripts/preparar_dados.py`
(o preparo só usa a biblioteca padrão do Python).

| Base | Origem | Conteúdo |
|------|--------|----------|
| Fake.br-Corpus | [roneysco/Fake.br-Corpus](https://github.com/roneysco/Fake.br-Corpus) (NILC/USP), commit `780f551` | 3.600 notícias falsas pareadas com 3.600 verdadeiras, com métricas linguísticas |
| Fakepedia Corpus | [andersoncordeiro/Fakepedia-Corpus](https://github.com/andersoncordeiro/Fakepedia-Corpus), commit `f9da77e` | 5.201 boatos únicos checados pelo Boatos.org (só *fake*) |

Nenhum dos dois repositórios declara licença. O uso aqui é acadêmico, com citação dos
trabalhos originais:

- Monteiro R.A. et al. (2018). *Contributions to the Study of Fake News in Portuguese:
  New Corpus and Automatic Detection Results*. PROPOR 2018, LNCS 11122.
- Charles A.C., Ruback L., Oliveira J. (2022). *Fakepedia Corpus: A Flexible Fake News Corpus in
  Portuguese*. PROPOR 2022, LNCS 13208.

Achados da análise exploratória: [doc/eda.md](doc/eda.md).
