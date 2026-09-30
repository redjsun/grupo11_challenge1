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

# FakeRecogna (Recogna/UNESP) — 5.951 checagens de 6 agências e 5.951 notícias reais.
# O texto vem lematizado; usamos URL e rótulo e recoletamos o texto original.
FAKERECOGNA_COMMIT="143842ba71e824a028572a89c9a522cbca40726e"
FAKERECOGNA_URL="https://huggingface.co/datasets/recogna-nlp/FakeRecogna/resolve/$FAKERECOGNA_COMMIT/FakeRecogna.csv"
FAKERECOGNA_SHA256="282110d0390a6dff37fedf43a22b3e61b97e30381bf96dacaa668ed45d3c4407"

if [ -d "$RAW/Fake.br-Corpus/full_texts" ]; then
  echo "Fake.br-Corpus já existe em data/raw/, pulando."
else
  echo "Baixando Fake.br-Corpus..."
  git clone --quiet "$FAKEBR_REPO" "$RAW/Fake.br-Corpus"
  git -C "$RAW/Fake.br-Corpus" checkout --quiet "$FAKEBR_COMMIT"
fi

CSV="$RAW/FakeRecogna.csv"
if [ -f "$CSV" ]; then
  echo "FakeRecogna.csv já existe em data/raw/, pulando."
else
  echo "Baixando FakeRecogna..."
  curl -fsSL "$FAKERECOGNA_URL" -o "$CSV"
fi

echo "$FAKERECOGNA_SHA256  $CSV" | sha256sum -c --quiet - \
  || { echo "Hash do FakeRecogna.csv não confere." >&2; exit 1; }

echo "Dados brutos prontos em data/raw/."
