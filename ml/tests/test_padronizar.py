import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

from padronizar import (
    Extracao,
    Prompt,
    aplicar,
    carregar_prompt,
    extrator_openai,
    interpretar_resposta,
    ler_cache,
    padronizar,
    texto_de_entrada,
)

REGISTROS = [
    {"id": "a", "texto_curto": "Vacina causa autismo", "texto": "longo a"},
    {"id": "b", "texto_curto": None, "texto": "Matéria longa sem título curto."},
    {"id": "c", "texto_curto": "", "texto": ""},
]


class ExtratorContador:
    """Extrator falso que conta as chamadas e responde por texto."""

    def __init__(self, respostas: dict[str, list[str]] | None = None):
        self.chamadas: list[str] = []
        self.respostas = respostas or {}

    def __call__(self, texto: str) -> Extracao:
        self.chamadas.append(texto)
        return Extracao(afirmacoes=self.respostas.get(texto, [texto]), tokens_entrada=10)


@pytest.fixture
def prompt():
    return Prompt(versao="v1", texto="Extraia as afirmações de: {texto}")


def silencioso(_: str) -> None:
    pass


def test_carregar_prompt_le_a_versao_do_nome(tmp_path):
    arquivo = tmp_path / "extrair_afirmacoes_v3.txt"
    arquivo.write_text("prompt", encoding="utf-8")
    assert carregar_prompt(arquivo).versao == "v3"


def test_carregar_prompt_exige_versao(tmp_path):
    arquivo = tmp_path / "extrair_afirmacoes.txt"
    arquivo.write_text("prompt", encoding="utf-8")
    with pytest.raises(ValueError):
        carregar_prompt(arquivo)


def test_preencher_usa_o_marcador_ou_acrescenta_no_fim():
    assert Prompt("v1", "A {texto} B").preencher("x") == "A x B"
    assert Prompt("v1", "Extraia:\n").preencher("x") == "Extraia:\n\nx"


def test_texto_de_entrada_prefere_o_curto_e_cai_no_longo():
    assert texto_de_entrada(REGISTROS[0]) == "Vacina causa autismo"
    assert texto_de_entrada(REGISTROS[1]) == "Matéria longa sem título curto."
    assert texto_de_entrada(REGISTROS[2]) is None


@pytest.mark.parametrize(
    "resposta, esperado",
    [
        ('["um", "dois"]', ["um", "dois"]),
        ('{"afirmacoes": ["um"]}', ["um"]),
        ('```json\n["um"]\n```', ["um"]),
        ('Aqui está: ["um", " "] fim', ["um"]),
        ("[]", []),
    ],
)
def test_interpretar_resposta(resposta, esperado):
    assert interpretar_resposta(resposta) == esperado


def test_interpretar_resposta_rejeita_formato_desconhecido():
    with pytest.raises(ValueError):
        interpretar_resposta("Não há afirmações.")


def test_padronizar_extrai_do_texto_longo_quando_falta_o_curto(tmp_path, prompt):
    extrator = ExtratorContador()
    cache = tmp_path / "padronizado_v1.jsonl"
    relatorio = padronizar(REGISTROS, prompt, extrator, cache, log=silencioso)
    assert sorted(extrator.chamadas) == ["Matéria longa sem título curto.", "Vacina causa autismo"]
    assert relatorio.processados == 2
    assert relatorio.sem_texto == 1
    assert relatorio.tokens_entrada == 20
    assert set(ler_cache(cache, prompt)) == {"a", "b"}


def test_segunda_rodada_nao_chama_a_llm_para_o_que_esta_em_cache(tmp_path, prompt):
    cache = tmp_path / "padronizado_v1.jsonl"
    padronizar(REGISTROS, prompt, ExtratorContador(), cache, log=silencioso)
    extrator = ExtratorContador()
    novo = {"id": "d", "texto_curto": "Frase nova", "texto": ""}
    relatorio = padronizar([*REGISTROS, novo], prompt, extrator, cache, log=silencioso)
    assert extrator.chamadas == ["Frase nova"]
    assert relatorio.em_cache == 2


def test_prompt_alterado_sem_trocar_versao_refaz_o_cache(tmp_path, prompt):
    cache = tmp_path / "padronizado_v1.jsonl"
    padronizar(REGISTROS, prompt, ExtratorContador(), cache, log=silencioso)
    alterado = Prompt(versao="v1", texto=prompt.texto + " Seja breve.")
    extrator = ExtratorContador()
    padronizar(REGISTROS, alterado, extrator, cache, log=silencioso)
    assert len(extrator.chamadas) == 2


def test_falha_da_llm_nao_entra_no_cache_e_e_refeita(tmp_path, prompt):
    def quebrado(texto: str) -> Extracao:
        raise TimeoutError("sem resposta")

    cache = tmp_path / "padronizado_v1.jsonl"
    relatorio = padronizar(REGISTROS, prompt, quebrado, cache, log=silencioso)
    assert relatorio.falhas == 2
    assert ler_cache(cache, prompt) == {}
    extrator = ExtratorContador()
    padronizar(REGISTROS, prompt, extrator, cache, log=silencioso)
    assert len(extrator.chamadas) == 2


def test_limite_e_paralelo(tmp_path, prompt):
    registros = [{"id": str(i), "texto_curto": f"frase {i}", "texto": ""} for i in range(20)]
    cache = tmp_path / "padronizado_v1.jsonl"
    relatorio = padronizar(
        registros, prompt, ExtratorContador(), cache, paralelo=4, limite=7, log=silencioso
    )
    assert relatorio.processados == 7
    linhas = cache.read_text(encoding="utf-8").splitlines()
    assert len({json.loads(linha)["id"] for linha in linhas}) == 7


def test_aplicar_usa_a_primeira_afirmacao_e_marca_a_quantidade(tmp_path, prompt):
    respostas = {
        "Vacina causa autismo": ["Vacina causa autismo", "Governo esconde dados"],
        "Matéria longa sem título curto.": [],  # opinião
    }
    cache = tmp_path / "padronizado_v1.jsonl"
    padronizar(REGISTROS, prompt, ExtratorContador(respostas), cache, log=silencioso)
    a, b, c = aplicar(REGISTROS, ler_cache(cache, prompt))
    assert (a["texto_padronizado"], a["n_afirmacoes"]) == ("Vacina causa autismo", 2)
    assert (b["texto_padronizado"], b["n_afirmacoes"]) == (None, 0)
    assert (c["texto_padronizado"], c["n_afirmacoes"]) == (None, None)
    assert a["texto_curto"] == "Vacina causa autismo"  # o original continua no registro


def test_extrator_openai_envia_o_prompt_preenchido_e_le_o_uso(prompt):
    recebido = {}

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            recebido["caminho"] = self.path
            recebido["auth"] = self.headers.get("Authorization")
            recebido["corpo"] = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            resposta = {
                "choices": [{"message": {"content": '{"afirmacoes": ["X disse Y"]}'}}],
                "usage": {"prompt_tokens": 42, "completion_tokens": 7},
            }
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps(resposta).encode())

        def log_message(self, *args):
            pass

    servidor = HTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=servidor.handle_request, daemon=True).start()
    base_url = f"http://127.0.0.1:{servidor.server_port}/v1"
    extracao = extrator_openai(prompt, base_url, "modelo-x", "chave")("texto do registro")
    servidor.server_close()

    assert extracao == Extracao(["X disse Y"], tokens_entrada=42, tokens_saida=7)
    assert recebido["caminho"] == "/v1/chat/completions"
    assert recebido["auth"] == "Bearer chave"
    assert recebido["corpo"]["model"] == "modelo-x"
    assert recebido["corpo"]["temperature"] == 0
    conteudo = recebido["corpo"]["messages"][0]["content"]
    assert conteudo == "Extraia as afirmações de: texto do registro"
