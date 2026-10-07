import json
import random

import pytest

from atalho import (
    N_PESOS,
    ModeloAtalho,
    auc,
    carregar_registros,
    primeira_palavra,
    rodar,
    variaveis_de_forma,
)


def test_variaveis_de_forma():
    v = variaveis_de_forma("URGENTE: vacina tem 5G! 🚨 Compartilhe.")
    assert v["palavras"] == 5
    assert v["% caixa alta"] == pytest.approx(40)  # URGENTE e 5G
    assert v["!"] and v["dois-pontos"] and v["número"] and v["emoji"]
    assert v["termina com ponto"] and v["começa com maiúscula"]
    assert not (v["?"] or v["aspas"] or v["tudo minúsculo"])


def test_variaveis_de_forma_texto_vazio_nao_quebra():
    v = variaveis_de_forma("")
    assert v["palavras"] == 0 and v["% caixa alta"] == 0


def test_primeira_palavra_ignora_pontuacao_e_caixa():
    assert primeira_palavra("“Vídeo mostra...") == "vídeo"
    assert primeira_palavra("!!!") is None


def registros_sinteticos(n: int, forma_entrega: bool, semente: int = 0) -> list[dict]:
    """Falsos terminam com ponto e verdadeiros não, se forma_entrega; senão, forma aleatória."""
    rnd = random.Random(semente)
    registros = []
    for i in range(n):
        classe = ("falso", "enganoso", "verdadeiro")[i % 3]
        ponto = classe == "falso" if forma_entrega else rnd.random() < 0.5
        palavras = rnd.randint(5, 15)
        texto = " ".join(
            rnd.choice(["vacina", "governo", "lula", "covid"]) for _ in range(palavras)
        )
        registros.append(
            {
                "id": str(i),
                "texto_curto": texto.capitalize() + ("." if ponto else ""),
                "veracidade": classe,
                "split_produto": ("treino", "treino", "validacao", "teste")[i % 4],
                "origem_rotulo": "agencia",
            }
        )
    return registros


def test_forma_que_entrega_a_classe_da_auc_alta():
    resultado = rodar(registros_sinteticos(600, forma_entrega=True), "texto_curto")
    assert resultado["splits"]["validacao"]["auc_por_classe"]["falso"] > 0.95


def test_forma_aleatoria_fica_perto_do_acaso():
    resultado = rodar(registros_sinteticos(1200, forma_entrega=False), "texto_curto")
    for split in ("validacao", "teste"):
        assert 0.4 < resultado["splits"][split]["auc_macro"] < 0.6


def test_rodar_lista_os_pesos_por_classe():
    resultado = rodar(registros_sinteticos(300, forma_entrega=True), "texto_curto")
    assert len(resultado["pesos"]) == N_PESOS
    assert set(resultado["pesos"][0]) == {"variavel", "falso", "enganoso", "verdadeiro"}
    assert resultado["pesos"][0]["variavel"] == "termina com ponto"


def test_auc_ignora_classe_ausente_no_split():
    modelo = ModeloAtalho().fit(["Um.", "dois", "Três.", "quatro"], ["falso", "verdadeiro"] * 2)
    medida = auc(modelo, ["Cinco.", "seis"], ["falso", "falso"])
    assert medida == {"registros": 2, "auc_macro": None, "auc_por_classe": {}}


def test_rodar_exige_duas_classes_no_treino():
    registros = [
        {"texto_curto": "a", "veracidade": "falso", "split_produto": "treino"},
        {"texto_curto": "b", "veracidade": "verdadeiro", "split_produto": "teste"},
    ]
    with pytest.raises(ValueError):
        rodar(registros, "texto_curto")


def test_carregar_registros_tira_portal_e_splits_fora(tmp_path):
    linhas = [
        {"id": "a", "split_produto": "treino", "origem_rotulo": "agencia"},
        {"id": "b", "split_produto": "treino", "origem_rotulo": "portal"},
        {"id": "c", "split_produto": "reserva", "origem_rotulo": "agencia"},
        {"id": "d", "split_produto": "fora", "origem_rotulo": "agencia"},
    ]
    caminho = tmp_path / "dataset.jsonl"
    caminho.write_text("".join(json.dumps(r) + "\n" for r in linhas), encoding="utf-8")
    assert [r["id"] for r in carregar_registros(caminho)] == ["a"]
    assert [r["id"] for r in carregar_registros(caminho, com_portal=True)] == ["a", "b"]
