"""Coleta checagens do Boatos.org e extrai o texto do boato que circulou.

Uso:
    python scripts/coletar_boatos.py --anos 2024 2025 2026      # teste temporal
    python scripts/coletar_boatos.py --fakerecogna              # URLs do FakeRecogna
    python scripts/coletar_boatos.py --anos 2026 --amostra 200  # amostra aleatória

As páginas ficam em cache em data/raw/boatos/paginas/, então rodar de novo só baixa o
que falta. A saída é data/raw/boatos/boatos.jsonl, com uma linha por URL.

Do texto do Boatos.org, só interessa o que foi escrito por quem espalhou o boato:
    alegacao     parágrafo "Boato – ...", resumo da alegação na voz do boato
    texto_boato  mensagem citada: <blockquote> (layout novo) ou parágrafo em itálico
                 vermelho (layout até ~2021)
O título ("É falso que...") e as seções de análise/checagem são do checador e não
entram como texto, para o modelo não aprender o estilo do checador.
"""

import argparse
import csv
import hashlib
import json
import random
import re
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "data" / "raw" / "boatos"
PAGINAS = DESTINO / "paginas"
SAIDA = DESTINO / "boatos.jsonl"
FAKERECOGNA = RAIZ / "data" / "raw" / "FakeRecogna.csv"

SITEMAP_ANO = "https://www.boatos.org/sitemap-posttype-post.{ano}.xml"
HEADERS = {"User-Agent": "grupo11-challenge1/1.0 (pesquisa academica sobre desinformacao)"}
# Traduções e listas de vários boatos não são uma checagem em português.
SECOES_IGNORADAS = ("/english/", "/espanol/", "/lista/")
PREFIXO_BOATO = re.compile(r"^\s*Boato\s*[–—-]\s*", re.I)


def urls_do_sitemap(ano: int) -> list[str]:
    resposta = requests.get(SITEMAP_ANO.format(ano=ano), headers=HEADERS, timeout=60)
    resposta.raise_for_status()
    urls = re.findall(r"<loc>([^<]+)</loc>", resposta.text)
    return [u for u in urls if not any(secao in u for secao in SECOES_IGNORADAS)]


def urls_do_fakerecogna() -> list[str]:
    if not FAKERECOGNA.exists():
        sys.exit("data/raw/FakeRecogna.csv não encontrado. Rode antes: bash scripts/baixar_dados.sh")
    with open(FAKERECOGNA, encoding="utf-8", newline="") as f:
        return [
            linha["URL"].strip()
            for linha in csv.DictReader(f)
            if "boatos.org" in linha["URL"] and linha["Classe"].startswith("0")
        ]


def caminho_cache(url: str) -> Path:
    return PAGINAS / f"{hashlib.sha1(url.encode()).hexdigest()}.html"


def baixar(url: str, intervalo: float) -> tuple[str | None, int]:
    """Devolve (html, status). Páginas já baixadas vêm do cache, sem requisição."""
    cache = caminho_cache(url)
    if cache.exists():
        return cache.read_text(encoding="utf-8"), 200
    time.sleep(intervalo)
    try:
        resposta = requests.get(url, headers=HEADERS, timeout=60)
    except requests.RequestException:
        return None, 0
    if resposta.status_code != 200:
        return None, resposta.status_code
    resposta.encoding = "utf-8"
    cache.write_text(resposta.text, encoding="utf-8")
    return resposta.text, 200


def limpar(texto: str) -> str:
    return re.sub(r"\s+", " ", texto).strip()


def extrair(url: str, html: str) -> dict:
    sopa = BeautifulSoup(html, "html.parser")
    titulo = sopa.find("h1")
    publicada = re.search(r'"datePublished"\s*:\s*"([^"]+)"', html)
    categoria = re.search(r"boatos\.org/([^/]+)/", url)

    alegacao = None
    for p in sopa.find_all("p"):
        texto = limpar(p.get_text(" "))
        texto = texto.replace("(adsbygoogle=window.adsbygoogle||[]).push({});", "").strip()
        if PREFIXO_BOATO.match(texto):
            alegacao = PREFIXO_BOATO.sub("", texto)
            break

    trechos = []
    for citacao in sopa.find_all("blockquote"):
        if citacao.find(["iframe", "h2", "h3"]):  # vídeos e "Confira também"
            continue
        trechos.append(limpar(citacao.get_text(" ")))
    for span in sopa.select('p em span[style*="#ff0000"], p span[style*="#ff0000"] em'):
        trechos.append(limpar(span.get_text(" ")))
    trechos = list(dict.fromkeys(t for t in trechos if t))

    return {
        "url": url,
        "data": publicada[1][:10] if publicada else None,
        "categoria": categoria[1] if categoria else None,
        "titulo_checagem": limpar(titulo.get_text(" ")) if titulo else None,
        "alegacao": alegacao,
        "texto_boato": "\n".join(trechos) or None,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--anos", type=int, nargs="*", default=[], help="anos dos sitemaps")
    parser.add_argument("--fakerecogna", action="store_true", help="URLs do Boatos.org no FakeRecogna")
    parser.add_argument("--amostra", type=int, help="coleta só N URLs sorteadas")
    parser.add_argument("--semente", type=int, default=42)
    parser.add_argument("--intervalo", type=float, default=1.0, help="segundos entre requisições")
    args = parser.parse_args()
    if not args.anos and not args.fakerecogna:
        parser.error("informe --anos e/ou --fakerecogna")

    origem_por_url = {}
    for ano in args.anos:
        for url in urls_do_sitemap(ano):
            origem_por_url.setdefault(url, f"sitemap-{ano}")
    if args.fakerecogna:
        for url in urls_do_fakerecogna():
            origem_por_url.setdefault(url, "fakerecogna")

    urls = sorted(origem_por_url)
    if args.amostra:
        urls = random.Random(args.semente).sample(urls, min(args.amostra, len(urls)))
    print(f"{len(urls)} URLs a processar")

    PAGINAS.mkdir(parents=True, exist_ok=True)
    existentes = {}
    if SAIDA.exists():
        for linha in SAIDA.read_text(encoding="utf-8").splitlines():
            registro = json.loads(linha)
            existentes[registro["url"]] = registro

    for i, url in enumerate(urls, 1):
        html, status = baixar(url, args.intervalo)
        registro = extrair(url, html) if html else {"url": url}
        registro.update(origem=origem_por_url[url], status=status)
        existentes[url] = registro
        if i % 50 == 0:
            print(f"  {i}/{len(urls)}")

    with open(SAIDA, "w", encoding="utf-8", newline="\n") as out:
        for url in sorted(existentes):
            out.write(json.dumps(existentes[url], ensure_ascii=False) + "\n")

    processados = [existentes[u] for u in urls]
    ok = [r for r in processados if r["status"] == 200]
    print(f"baixadas: {len(ok)}/{len(processados)}")
    print(f"com alegação: {sum(bool(r.get('alegacao')) for r in ok)}")
    print(f"com texto do boato: {sum(bool(r.get('texto_boato')) for r in ok)}")
    print(f"Gerado {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
