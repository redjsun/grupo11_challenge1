"""Padroniza o texto curto do treino com o mesmo prompt de extração do uso (issue #20).

Uso:
    python ml/padronizar.py --prompt ml/prompts/extrair_afirmacoes_v1.txt
    python ml/padronizar.py --prompt ... --limite 50     # amostra, para medir tempo e custo

Em uso, o classificador recebe afirmações extraídas pela LLM; no treino, recebia o
`texto_curto` original (manchete nos verdadeiros, alegação de checador nos falsos). Este
script passa todos os registros de data/processed/dataset.jsonl, de todos os splits, pelo
mesmo prompt do uso. Quem não tem `texto_curto` (Fake.br, verdadeiras do FakeTrue.Br, a
maior parte das mensagens) é extraído do `texto`.

Cache: data/processed/padronizado_<versao>.jsonl, uma linha por registro, com o `id`, as
afirmações extraídas e o hash do prompt. A versão vem do nome do arquivo do prompt
(extrair_afirmacoes_v1.txt -> v1). Rodar de novo só chama a LLM para os ids que faltam;
se o texto do prompt mudar sem trocar a versão, as linhas antigas deixam de valer e são
refeitas. Cada linha é gravada assim que fica pronta, então dá para interromper e retomar.

Várias afirmações ou nenhuma (decisão registrada em doc/padronizacao.md): o cache guarda
todas; `aplicar` usa a primeira como `texto_padronizado` e marca `n_afirmacoes`. Com zero
(opinião), `texto_padronizado` fica vazio e o registro sai do treino de frases curtas.

LLM: qualquer endpoint compatível com a API de chat da OpenAI (Ollama, llama.cpp, vLLM ou
um provedor hospedado), configurado por LLM_BASE_URL, LLM_MODEL e LLM_API_KEY.
`--provedor fake` devolve o próprio texto, para testar o fluxo sem LLM.

Só biblioteca padrão, como scripts/preparar_dados.py.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import threading
import time
import urllib.request
from collections.abc import Callable, Iterable
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PROCESSED = RAIZ / "data" / "processed"
DATASET = PROCESSED / "dataset.jsonl"

# O prompt recebe o texto neste marcador; sem ele, o texto vai depois do prompt.
MARCADOR_TEXTO = "{texto}"


@dataclass
class Extracao:
    afirmacoes: list[str]
    tokens_entrada: int = 0
    tokens_saida: int = 0


# Recebe o texto de um registro e devolve as afirmações extraídas.
Extrator = Callable[[str], Extracao]


@dataclass
class Prompt:
    versao: str
    texto: str
    sha1: str = field(init=False)

    def __post_init__(self):
        self.sha1 = hashlib.sha1(self.texto.encode()).hexdigest()[:12]

    def preencher(self, texto: str) -> str:
        if MARCADOR_TEXTO in self.texto:
            return self.texto.replace(MARCADOR_TEXTO, texto)
        return f"{self.texto.rstrip()}\n\n{texto}"


def carregar_prompt(caminho: Path) -> Prompt:
    """extrair_afirmacoes_v3.txt -> versão v3. Exige a versão no nome do arquivo."""
    m = re.search(r"_(v\d+)$", caminho.stem)
    if not m:
        raise ValueError(f"O nome do prompt precisa terminar em _vN: {caminho.name}")
    return Prompt(versao=m[1], texto=caminho.read_text(encoding="utf-8"))


def caminho_cache(versao: str, pasta: Path = PROCESSED) -> Path:
    return pasta / f"padronizado_{versao}.jsonl"


def texto_de_entrada(registro: dict) -> str | None:
    """O texto curto, se houver; senão o texto longo, de onde a LLM extrai a afirmação."""
    for campo in ("texto_curto", "texto"):
        valor = (registro.get(campo) or "").strip()
        if valor:
            return valor
    return None


def ler_cache(caminho: Path, prompt: Prompt) -> dict[str, dict]:
    """Linhas do cache feitas com este mesmo prompt, por id. As de outro prompt são ignoradas."""
    if not caminho.exists():
        return {}
    cache = {}
    for linha in caminho.read_text(encoding="utf-8").splitlines():
        if not linha.strip():
            continue
        item = json.loads(linha)
        if item["prompt_sha1"] == prompt.sha1:
            cache[item["id"]] = item
    return cache


def interpretar_resposta(resposta: str) -> list[str]:
    """Aceita uma lista JSON de strings ou {"afirmacoes": [...]}, mesmo cercada de texto.

    Uma lista vazia quer dizer opinião (nenhuma afirmação checável).
    """
    texto = re.sub(r"^```(?:json)?\s*|\s*```$", "", resposta.strip())
    for inicio in (i for i, c in enumerate(texto) if c in "[{"):
        try:
            valor, _ = json.JSONDecoder().raw_decode(texto, inicio)
        except json.JSONDecodeError:
            continue
        if isinstance(valor, dict):
            valor = valor.get("afirmacoes")
        if isinstance(valor, list) and all(isinstance(v, str) for v in valor):
            return [v.strip() for v in valor if v.strip()]
    raise ValueError(f"Resposta da LLM fora do formato esperado: {resposta[:200]!r}")


def extrator_fake(texto: str) -> Extracao:
    """Sem LLM: devolve o texto como única afirmação. Serve para testar o fluxo."""
    return Extracao(afirmacoes=[texto])


def extrator_openai(
    prompt: Prompt, base_url: str, modelo: str, chave: str | None, timeout: float = 300
) -> Extrator:
    """Endpoint /chat/completions compatível com a OpenAI (Ollama, llama.cpp, vLLM, hospedados)."""
    url = base_url.rstrip("/") + "/chat/completions"
    cabecalhos = {"Content-Type": "application/json"}
    if chave:
        cabecalhos["Authorization"] = f"Bearer {chave}"

    def extrair(texto: str) -> Extracao:
        corpo = {
            "model": modelo,
            "messages": [{"role": "user", "content": prompt.preencher(texto)}],
            "temperature": 0,
        }
        requisicao = urllib.request.Request(url, json.dumps(corpo).encode(), cabecalhos)
        with urllib.request.urlopen(requisicao, timeout=timeout) as resposta:
            dados = json.load(resposta)
        uso = dados.get("usage") or {}
        return Extracao(
            afirmacoes=interpretar_resposta(dados["choices"][0]["message"]["content"]),
            tokens_entrada=uso.get("prompt_tokens", 0),
            tokens_saida=uso.get("completion_tokens", 0),
        )

    return extrair


@dataclass
class Relatorio:
    versao: str
    prompt_sha1: str
    modelo: str
    total: int = 0
    em_cache: int = 0
    processados: int = 0
    sem_texto: int = 0
    falhas: int = 0
    opinioes: int = 0
    varias_afirmacoes: int = 0
    tokens_entrada: int = 0
    tokens_saida: int = 0
    segundos: float = 0.0

    def resumo(self) -> str:
        por_item = self.segundos / self.processados if self.processados else 0
        return (
            f"prompt {self.versao} ({self.prompt_sha1}), modelo {self.modelo}\n"
            f"  registros: {self.total} | já em cache: {self.em_cache} | chamadas à LLM: "
            f"{self.processados} | falhas: {self.falhas} | sem texto: {self.sem_texto}\n"
            f"  nesta rodada: {self.opinioes} sem afirmação (opinião), "
            f"{self.varias_afirmacoes} com várias\n"
            f"  tempo: {self.segundos:.0f} s ({por_item:.2f} s por item) | tokens: "
            f"{self.tokens_entrada} de entrada, {self.tokens_saida} de saída"
        )


def padronizar(
    registros: Iterable[dict],
    prompt: Prompt,
    extrator: Extrator,
    cache_path: Path,
    modelo: str = "",
    paralelo: int = 1,
    limite: int | None = None,
    log: Callable[[str], None] = print,
) -> Relatorio:
    """Extrai as afirmações dos registros que ainda não estão no cache e grava no cache."""
    relatorio = Relatorio(versao=prompt.versao, prompt_sha1=prompt.sha1, modelo=modelo)
    cache = ler_cache(cache_path, prompt)
    pendentes = []
    for registro in registros:
        relatorio.total += 1
        if registro["id"] in cache:
            relatorio.em_cache += 1
            continue
        texto = texto_de_entrada(registro)
        if texto is None:
            relatorio.sem_texto += 1
            continue
        pendentes.append((registro["id"], texto))
    if limite is not None:
        pendentes = pendentes[:limite]

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    trava = threading.Lock()
    inicio = time.monotonic()

    def processar(id_: str, texto: str) -> tuple[str, Extracao]:
        return id_, extrator(texto)

    with (
        open(cache_path, "a", encoding="utf-8", newline="\n") as saida,
        ThreadPoolExecutor(max_workers=paralelo) as pool,
    ):
        futuros = [pool.submit(processar, id_, texto) for id_, texto in pendentes]
        for n, futuro in enumerate(as_completed(futuros), 1):
            try:
                id_, extracao = futuro.result()
            except (OSError, ValueError, KeyError, IndexError) as erro:  # rede, timeout, JSON
                relatorio.falhas += 1
                log(f"  falha: {erro}")
                continue
            item = {
                "id": id_,
                "versao": prompt.versao,
                "prompt_sha1": prompt.sha1,
                "modelo": modelo,
                "afirmacoes": extracao.afirmacoes,
            }
            with trava:
                saida.write(json.dumps(item, ensure_ascii=False) + "\n")
                saida.flush()
            relatorio.processados += 1
            relatorio.opinioes += not extracao.afirmacoes
            relatorio.varias_afirmacoes += len(extracao.afirmacoes) > 1
            relatorio.tokens_entrada += extracao.tokens_entrada
            relatorio.tokens_saida += extracao.tokens_saida
            if n % 100 == 0:
                log(f"  {n}/{len(pendentes)} ({time.monotonic() - inicio:.0f} s)")
    relatorio.segundos = time.monotonic() - inicio
    return relatorio


def aplicar(registros: Iterable[dict], cache: dict[str, dict]) -> Iterable[dict]:
    """Acrescenta `texto_padronizado` e `n_afirmacoes` a cada registro (para ml/dados.py).

    Regra: a primeira afirmação vira o texto padronizado. Sem afirmação (opinião) ou sem
    linha no cache, `texto_padronizado` fica None e o registro não entra no treino de
    frases curtas; `n_afirmacoes` é None quando o registro não foi processado.
    """
    for registro in registros:
        item = cache.get(registro["id"])
        afirmacoes = item["afirmacoes"] if item else []
        yield {
            **registro,
            "texto_padronizado": afirmacoes[0] if afirmacoes else None,
            "n_afirmacoes": len(afirmacoes) if item else None,
        }


def ler_dataset(caminho: Path) -> Iterable[dict]:
    with open(caminho, encoding="utf-8") as entrada:
        for linha in entrada:
            if linha.strip():
                yield json.loads(linha)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument(
        "--prompt", type=Path, required=True, help="arquivo extrair_afirmacoes_vN.txt"
    )
    parser.add_argument("--dataset", type=Path, default=DATASET)
    parser.add_argument("--provedor", choices=("openai", "fake"), default="openai")
    parser.add_argument("--paralelo", type=int, default=1, help="chamadas simultâneas à LLM")
    parser.add_argument("--limite", type=int, help="processa no máximo N itens novos")
    args = parser.parse_args()

    if not args.dataset.exists():
        sys.exit(f"{args.dataset} não encontrado. Rode antes: make dados")
    prompt = carregar_prompt(args.prompt)
    if args.provedor == "fake":
        extrator, modelo = extrator_fake, "fake"
    else:
        base_url, modelo = os.environ.get("LLM_BASE_URL"), os.environ.get("LLM_MODEL")
        if not base_url or not modelo:
            sys.exit("Defina LLM_BASE_URL e LLM_MODEL no .env (ou use --provedor fake).")
        extrator = extrator_openai(prompt, base_url, modelo, os.environ.get("LLM_API_KEY"))

    cache_path = caminho_cache(prompt.versao)
    relatorio = padronizar(
        ler_dataset(args.dataset),
        prompt,
        extrator,
        cache_path,
        modelo=modelo,
        paralelo=args.paralelo,
        limite=args.limite,
    )
    print(relatorio.resumo())
    print(f"Cache em {cache_path.relative_to(RAIZ)}")
    # Tempo e tokens de cada rodada, para registrar o custo do lote (critério da #20).
    with open(cache_path.with_suffix(".rodadas.jsonl"), "a", encoding="utf-8") as rodadas:
        rodadas.write(json.dumps(vars(relatorio), ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
