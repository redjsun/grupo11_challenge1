"""De ponta a ponta no dataset de fixture: configuração → dados → atalho → modelo → avaliação."""

from pathlib import Path

import numpy as np
import pytest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from atalho import rodar
from avaliar import avaliar, gravar_previsoes, relatorio
from configuracao import CONFIGS, ErroConfiguracao, carregar_configuracao
from dados import carregar

SMOKE = CONFIGS / "smoke.toml"


@pytest.mark.parametrize("arquivo", sorted(CONFIGS.glob("*.toml")), ids=lambda p: p.stem)
def test_todas_as_configuracoes_versionadas_carregam(arquivo, monkeypatch):
    monkeypatch.setenv("LLM_MODEL", "modelo-de-teste")  # a variante padronizada lê do .env
    config = carregar_configuracao(arquivo)
    assert config.nome and config.sementes and config.saida.is_absolute()


def test_configuracao_invalida(tmp_path, monkeypatch):
    monkeypatch.delenv("LLM_MODEL", raising=False)
    arquivo = tmp_path / "x.toml"
    arquivo.write_text('nome = "x"\nmodelo = "svm"\nsaida = "s"\n', encoding="utf-8")
    with pytest.raises(ErroConfiguracao, match="modelo"):
        carregar_configuracao(arquivo)
    arquivo.write_text(
        'nome = "x"\nmodelo = "bert"\nsaida = "s"\n[dados]\ntexto = "padronizado"\n',
        encoding="utf-8",
    )
    with pytest.raises(ErroConfiguracao, match="padronizado"):
        carregar_configuracao(arquivo)


def treinar_referencia_minima(splits, treino: dict, semente: int):
    """Duas regressões sobre o mesmo TF-IDF (Frank e Hall), só para o smoke."""
    vetorizador = TfidfVectorizer(
        ngram_range=tuple(treino["ngram_palavras"]),
        min_df=treino["min_df"],
        max_df=treino["max_df"],
        sublinear_tf=treino["sublinear_tf"],
    )
    exemplos = splits["treino"]
    matriz = vetorizador.fit_transform([e.texto for e in exemplos])
    fronteiras = [
        LogisticRegression(
            C=treino["grade_c"][0], max_iter=treino["max_iter"], random_state=semente
        ).fit(
            matriz, [getattr(e, alvo) for e in exemplos], sample_weight=[e.peso for e in exemplos]
        )
        for alvo in ("y1", "y2")
    ]
    previsoes = {}
    for split in ("validacao", "teste"):
        x = vetorizador.transform([e.texto for e in splits[split]])
        p1, p2 = (f.predict_proba(x)[:, 1] for f in fronteiras)
        previsoes[split] = (splits[split], p1, np.minimum(p2, p1))
    return previsoes


def test_smoke_de_ponta_a_ponta(tmp_path):
    config = carregar_configuracao(SMOKE)
    conjunto = carregar(**config.argumentos_dados())
    assert {s: len(e) for s, e in conjunto.splits.items()} == {
        "treino": 60,
        "validacao": 15,
        "teste": 15,
    }

    piso = rodar(conjunto.splits)
    assert piso["splits"]["validacao"]["registros"] == 15

    pasta = tmp_path / config.nome
    previsoes = treinar_referencia_minima(conjunto.splits, config.treino, config.sementes[0])
    gravar_previsoes(pasta, previsoes, config.registro(conjunto.dataset_sha256))

    resultado = avaliar(pasta, config.dataset, teste=True, atalho=tmp_path / "sem-atalho.json")
    assert resultado["config"]["configuracao_sha1"] == config.sha1
    assert resultado["config"]["dataset_sha256"] == conjunto.dataset_sha256
    geral = resultado["splits"]["validacao"]["geral"]
    assert geral["n"] == 15 and geral["f1_macro"] > 0.5  # frases do mesmo molde do treino
    assert resultado["envelhecimento"] is not None
    assert "## teste" in relatorio(resultado)
    assert Path(pasta / "config.json").exists()
