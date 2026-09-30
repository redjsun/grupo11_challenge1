# Desafio Fake News - TIC

Repositório dedicado ao desafio de fake news do TIC.

## Dados

As bases não ficam no Git: `data/` está no `.gitignore`. Para baixá-las e gerar a
versão unificada:

```bash
make dados    # data/raw/ (brutos) + data/processed/dataset.jsonl
make eda      # Jupyter Lab com notebooks/eda.ipynb em http://localhost:8888
```

Sem `make`: `bash scripts/baixar_dados.sh`, `python scripts/coletar_boatos.py --fakerecogna --anos 2024 2025 2026`
e `python scripts/preparar_dados.py`. A coleta usa `requests` e `beautifulsoup4`
(`notebooks/requirements.txt`) e leva cerca de 2 horas na primeira vez, por causa do
intervalo de 1 s entre requisições. Depois as páginas ficam em cache em `data/raw/boatos/`.

| Base | Origem | Uso |
|------|--------|-----|
| Fake.br-Corpus | [roneysco/Fake.br-Corpus](https://github.com/roneysco/Fake.br-Corpus) (NILC/USP), commit `780f551` | treino: 3.600 notícias falsas pareadas com 3.600 verdadeiras (2016–2018) |
| FakeRecogna | [recogna-nlp/FakeRecogna](https://huggingface.co/datasets/recogna-nlp/FakeRecogna) (UNESP), commit `143842b`, licença MIT | treino: URLs e rótulos de 11.902 notícias (2019–2021); o texto é recoletado porque vem lematizado |
| Boatos.org | [boatos.org](https://www.boatos.org/), coletado por `scripts/coletar_boatos.py` | texto dos boatos: das URLs do FakeRecogna (treino) e das checagens de 2024 em diante (teste temporal) |

Da página do Boatos.org, só guardamos o boato que circulou. O texto do checador fica
de fora, para o modelo não aprender o estilo da checagem.

O Fake.br não declara licença; o uso aqui é acadêmico, com citação dos trabalhos:

- Monteiro R.A. et al. (2018). *Contributions to the Study of Fake News in Portuguese:
  New Corpus and Automatic Detection Results*. PROPOR 2018, LNCS 11122.
- Garcia G.L., Afonso L.C.S., Papa J.P. (2022). *FakeRecogna: A New Brazilian Corpus for
  Fake News Detection*. PROPOR 2022, LNCS 13208.

Achados da análise exploratória, incluindo por que o Fakepedia foi descartado:
[doc/eda.md](doc/eda.md).
