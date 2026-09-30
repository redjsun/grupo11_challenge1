"""Coleta checagens em português pela Google Fact Check Tools API.

Uso:
    python scripts/coletar_factcheck.py --descobrir    # quais agências aparecem em PT
    python scripts/coletar_factcheck.py                # coleta todas as agências de AGENCIAS
    python scripts/coletar_factcheck.py --sites aosfatos.org

Precisa da variável FACTCHECK_API_KEY (no ambiente ou no .env da raiz). A saída é
data/raw/factcheck/checagens.jsonl, uma linha por checagem (alegação + veredito), e
o resumo impresso no fim mostra os vereditos mais comuns para montar o mapeamento
verdadeiro/falso no preparo.
"""

import argparse
import json
import os
import sys
import time
from collections import Counter
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "data" / "raw" / "factcheck" / "checagens.jsonl"
ENDPOINT = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

# Agências brasileiras de checagem. Confira os valores com --descobrir: a API filtra
# pelo site do publicador como ela o registra.
AGENCIAS = [
    "lupa.uol.com.br",
    "aosfatos.org",
    "g1.globo.com",
    "projetocomprova.com.br",
    "estadao.com.br",
    "checamos.afp.com",
    "boatos.org",
    "e-farsas.com",
    "noticias.uol.com.br",
]

# Buscas genéricas usadas só para descobrir quais publicadores existem em PT.
TERMOS_DESCOBERTA = ["lula", "bolsonaro", "vacina", "eleição", "vídeo", "stf", "covid", "golpe"]


def chave_api() -> str:
    chave = os.environ.get("FACTCHECK_API_KEY")
    env = RAIZ / ".env"
    if not chave and env.exists():
        for linha in env.read_text(encoding="utf-8").splitlines():
            if linha.startswith("FACTCHECK_API_KEY="):
                chave = linha.split("=", 1)[1].strip()
    if not chave:
        sys.exit("Defina FACTCHECK_API_KEY no .env (veja .env.example).")
    return chave


def buscar(params: dict, chave: str, max_paginas: int):
    """Percorre as páginas de claims:search e devolve os claims brutos."""
    params = {**params, "languageCode": "pt", "pageSize": 100, "key": chave}
    for _ in range(max_paginas):
        resposta = requests.get(ENDPOINT, params=params, timeout=60)
        if resposta.status_code != 200:
            sys.exit(f"Erro {resposta.status_code} da API: {resposta.text[:300]}")
        corpo = resposta.json()
        yield from corpo.get("claims", [])
        if not corpo.get("nextPageToken"):
            return
        params["pageToken"] = corpo["nextPageToken"]
        time.sleep(0.2)


def achatar(claim: dict) -> list[dict]:
    """Uma alegação pode ter várias checagens; gera uma linha por checagem."""
    return [
        {
            "alegacao": claim.get("text"),
            "autor_alegacao": claim.get("claimant"),
            "data_alegacao": (claim.get("claimDate") or "")[:10] or None,
            "agencia": review.get("publisher", {}).get("name"),
            "site_agencia": review.get("publisher", {}).get("site"),
            "url": review.get("url"),
            "titulo_checagem": review.get("title"),
            "data_checagem": (review.get("reviewDate") or "")[:10] or None,
            "veredito": review.get("textualRating"),
            "idioma": review.get("languageCode"),
        }
        for review in claim.get("claimReview", [])
    ]


def descobrir(chave: str):
    sites = Counter()
    for termo in TERMOS_DESCOBERTA:
        for claim in buscar({"query": termo}, chave, max_paginas=3):
            for linha in achatar(claim):
                sites[linha["site_agencia"]] += 1
    print("Publicadores encontrados em buscas genéricas (site: checagens):")
    for site, n in sites.most_common():
        print(f"  {site}: {n}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--descobrir", action="store_true", help="lista publicadores em PT")
    parser.add_argument("--sites", nargs="*", default=AGENCIAS, help="sites das agências")
    parser.add_argument("--max-paginas", type=int, default=500, help="limite por agência")
    args = parser.parse_args()
    chave = chave_api()

    if args.descobrir:
        descobrir(chave)
        return

    por_url = {}
    if SAIDA.exists():
        for linha in SAIDA.read_text(encoding="utf-8").splitlines():
            registro = json.loads(linha)
            por_url[registro["url"]] = registro

    for site in args.sites:
        antes = len(por_url)
        for claim in buscar({"reviewPublisherSiteFilter": site}, chave, args.max_paginas):
            for linha in achatar(claim):
                if linha["url"]:
                    por_url[linha["url"]] = linha
        print(f"{site}: {len(por_url) - antes} checagens novas")

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8", newline="\n") as out:
        for url in sorted(por_url):
            out.write(json.dumps(por_url[url], ensure_ascii=False) + "\n")

    registros = list(por_url.values())
    print(f"\n{len(registros)} checagens em {SAIDA.relative_to(RAIZ)}")
    print("Vereditos mais comuns:")
    for veredito, n in Counter((r["veredito"] or "").strip().lower() for r in registros).most_common(25):
        print(f"  {n:6}  {veredito}")
    anos = Counter((r["data_checagem"] or "????")[:4] for r in registros)
    print("Checagens por ano:", dict(sorted(anos.items())))


if __name__ == "__main__":
    main()
