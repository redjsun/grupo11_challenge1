"""Unifica as bases de data/raw/ em data/processed/dataset.jsonl.

Uso: python scripts/preparar_dados.py   (só biblioteca padrão)

Cada linha do JSONL é uma notícia com os campos:
    id, base, rotulo, titulo, texto, categoria, data, autor, url, par_id, metricas, split
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "raw"
SAIDA = RAIZ / "data" / "processed" / "dataset.jsonl"

MESES = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12,
}

# Ordem das linhas dos arquivos *-meta.txt do Fake.br (ver README do corpus).
METRICAS_FAKEBR = [
    "n_tokens", "n_palavras", "n_types", "n_links", "n_maiusculas", "n_verbos",
    "n_verbos_subj_imp", "n_substantivos", "n_adjetivos", "n_adverbios", "n_modais",
    "n_pron_1e2_sing", "n_pron_1_plural", "n_pronomes", "pausalidade", "n_caracteres",
    "media_tam_sentenca", "media_tam_palavra", "pct_erros_ortografia", "emotividade",
    "diversidade",
]


def parse_data(bruto: str) -> str | None:
    """Converte os vários formatos de data do Fake.br para ISO (AAAA-MM-DD)."""
    s = bruto.strip()
    try:
        if m := re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", s):
            a, mes, d = map(int, m.groups())
        elif m := re.match(r"(\d{1,2})/(\d{1,2})/(\d{2,4})", s):
            d, mes, a = map(int, m.groups())
            if mes > 12:  # alguns registros vêm como M/D/AAAA
                d, mes = mes, d
            if a < 100:
                a += 2000
        elif m := re.fullmatch(r"(\d{1,2}) de (\w+) de (\d{4})", s):
            d, a = int(m[1]), int(m[3])
            mes = MESES[m[2].lower()]
        else:
            return None
        if a < 2000:  # há datas digitadas errado na origem, como 0201-...
            return None
        return date(a, mes, d).isoformat()
    except (ValueError, KeyError):
        return None


def ler_fakebr():
    base = RAW / "Fake.br-Corpus" / "full_texts"
    for rotulo in ("fake", "true"):
        pasta = base / rotulo
        for arq in sorted(pasta.glob("*.txt"), key=lambda p: int(p.stem)):
            meta = (base / f"{rotulo}-meta-information" / f"{arq.stem}-meta.txt")
            linhas = meta.read_text(encoding="utf-8-sig").split("\n")
            autor, url, categoria, data_bruta = (linha.strip() for linha in linhas[:4])
            metricas = {
                nome: None if valor == "None" else float(valor)
                for nome, valor in zip(METRICAS_FAKEBR, linhas[4:25])
            }
            yield {
                "id": f"fakebr-{rotulo}-{arq.stem}",
                "base": "fakebr",
                "rotulo": rotulo,
                "titulo": None,
                "texto": arq.read_text(encoding="utf-8-sig").strip(),
                "categoria": categoria,
                "data": parse_data(data_bruta),
                "autor": None if autor in ("", "None") else autor,
                "url": url,
                "par_id": int(arq.stem),
                "metricas": metricas,
                "split": "treino",
            }


def ler_boatos():
    """Checagens coletadas por scripts/coletar_boatos.py.

    As URLs vindas do FakeRecogna (2019–2021) vão para treino; as dos sitemaps
    (2024 em diante) formam o teste temporal.
    """
    arquivo = RAW / "boatos" / "boatos.jsonl"
    if not arquivo.exists():
        print("data/raw/boatos/boatos.jsonl não encontrado; rode scripts/coletar_boatos.py")
        return
    for linha in arquivo.read_text(encoding="utf-8").splitlines():
        r = json.loads(linha)
        # No layout antigo, a alegação "Boato – ..." já é a mensagem inteira.
        texto = r.get("texto_boato") or r.get("alegacao")
        if r.get("status") != 200 or not texto:
            continue
        if any(secao in r["url"] for secao in ("/english/", "/espanol/", "/lista/")):
            continue
        yield {
            "id": "boatos-" + r["url"].rsplit("/", 1)[-1].removesuffix(".html"),
            "base": "boatos",
            "rotulo": "fake",
            "titulo": r.get("alegacao"),
            "texto": texto,
            "categoria": r.get("categoria"),
            "data": r.get("data"),
            "autor": None,
            "url": r["url"],
            "par_id": None,
            "metricas": None,
            "split": "treino" if r["origem"] == "fakerecogna" else "teste",
        }


def main():
    if not RAW.exists():
        sys.exit("data/raw/ não encontrado. Rode antes: bash scripts/baixar_dados.sh")
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    contagem = {}
    with open(SAIDA, "w", encoding="utf-8", newline="\n") as out:
        for leitor in (ler_fakebr, ler_boatos):
            for registro in leitor():
                out.write(json.dumps(registro, ensure_ascii=False) + "\n")
                chave = (registro["base"], registro["rotulo"], registro["split"])
                contagem[chave] = contagem.get(chave, 0) + 1
    for (base, rotulo, split), n in sorted(contagem.items()):
        print(f"{base:8} {rotulo:5} {split:7} {n:6}")
    print(f"Gerado {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
