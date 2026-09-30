#!/usr/bin/env bash
# Baixa as bases brutas para data/raw/, fixadas em commits conhecidos.
# Uso: bash scripts/baixar_dados.sh   (ou: make dados)
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$RAIZ/data/raw"
mkdir -p "$RAW"

# Fake.br-Corpus (NILC/USP) — 3.600 pares de notícias falsas e verdadeiras.
FAKEBR_REPO="https://github.com/roneysco/Fake.br-Corpus.git"
FAKEBR_COMMIT="780f5516c4ae070761632d98ac3368f3ded09d35"

# Fakepedia Corpus — boatos checados pelo Boatos.org.
FAKEPEDIA_COMMIT="f9da77eeebcf5238523128902423425544814546"
FAKEPEDIA_URL="https://raw.githubusercontent.com/andersoncordeiro/Fakepedia-Corpus/$FAKEPEDIA_COMMIT/dataset/fakepedia-corpus-v1.csv"
FAKEPEDIA_SHA256="8f1978864b96bea6d925c8af8904ecb6e87be9105018bfa769d08c3c8bf59d82"

if [ -d "$RAW/Fake.br-Corpus/full_texts" ]; then
  echo "Fake.br-Corpus já existe em data/raw/, pulando."
else
  echo "Baixando Fake.br-Corpus..."
  git clone --quiet "$FAKEBR_REPO" "$RAW/Fake.br-Corpus"
  git -C "$RAW/Fake.br-Corpus" checkout --quiet "$FAKEBR_COMMIT"
fi

CSV="$RAW/fakepedia-corpus-v1.csv"
if [ -f "$CSV" ]; then
  echo "fakepedia-corpus-v1.csv já existe em data/raw/, pulando."
else
  echo "Baixando Fakepedia Corpus..."
  curl -fsSL "$FAKEPEDIA_URL" -o "$CSV"
fi

echo "$FAKEPEDIA_SHA256  $CSV" | sha256sum -c --quiet - \
  || { echo "Hash do fakepedia-corpus-v1.csv não confere." >&2; exit 1; }

echo "Dados brutos prontos em data/raw/."
