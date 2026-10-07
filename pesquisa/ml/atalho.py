"""Teste de atalho: quanto a forma do texto, sem o conteúdo, já separa as classes (issue #8).

Uso:
    python pesquisa/ml/atalho.py
    python pesquisa/ml/atalho.py --prompt api/app/prompts/extrair_afirmacoes_v1.txt   # + padronizado
    python pesquisa/ml/atalho.py --com-portal    # inclui os portais, como o notebook eda_2 (seção 7)

Uma regressão logística que só vê tamanho, pontuação, caixa alta e a primeira palavra. A AUC
dela é o piso: um classificador que não passa dela com folga aprendeu o formato, não a
veracidade. É só diagnóstico e nunca vai para a API.

Versões do texto:
    original                    `texto_curto`
    padronizado                 `texto_padronizado`, do cache da LLM (#20), com --prompt
    original_mesmos_registros   `texto_curto` só nos registros que também têm o padronizado,
                                para comparar as duas versões na mesma população
Com a padronização igualando o formato, a AUC do padronizado deve ficar abaixo da do
original nos mesmos registros.

A saída vai para pesquisa/ml/saidas/atalho.json, que o avaliar.py (#13) lê para comparar cada modelo
com o piso.

Os registros vêm de pesquisa/data/processed/dataset.jsonl, nos splits do protocolo B, sem os portais
(como em pesquisa/ml/dados.py, #7). Quando a #7 existir, `carregar_registros` passa a usar
`dados.carregar()`.
"""

import argparse
import json
import re
import sys
from collections import Counter
from collections.abc import Iterable
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.preprocessing import StandardScaler

from padronizar import aplicar, caminho_cache, carregar_prompt, ler_cache

RAIZ = Path(__file__).resolve().parent.parent
DATASET = RAIZ / "data" / "processed" / "dataset.jsonl"
SAIDA = Path(__file__).resolve().parent / "saidas" / "atalho.json"

CLASSES = ("falso", "enganoso", "verdadeiro")
SPLITS = ("treino", "validacao", "teste")
N_PRIMEIRAS = 30  # primeiras palavras mais comuns no treino que viram coluna
N_PESOS = 12

EMOJI = re.compile("[\U0001f300-\U0001faff☀-➿]")
PALAVRA = re.compile(r"\w+")


def variaveis_de_forma(texto: str) -> dict[str, float]:
    """Variáveis que descrevem a forma do texto, sem o conteúdo."""
    palavras = PALAVRA.findall(texto)
    caixa_alta = sum(p.isupper() and len(p) > 1 for p in palavras)
    return {
        "palavras": len(palavras),
        "% caixa alta": 100 * caixa_alta / max(len(palavras), 1),
        "!": "!" in texto,
        "?": "?" in texto,
        "aspas": bool(re.search('["“”]', texto)),
        "dois-pontos": ":" in texto,
        "número": bool(re.search(r"\d", texto)),
        "emoji": bool(EMOJI.search(texto)),
        "termina com ponto": texto.rstrip().endswith("."),
        "começa com maiúscula": texto[:1].isupper(),
        "tudo minúsculo": texto == texto.lower(),
    }


def primeira_palavra(texto: str) -> str | None:
    m = PALAVRA.search(texto)
    return m[0].lower() if m else None


class ModeloAtalho:
    """Variáveis de forma padronizadas + regressão logística com classes balanceadas."""

    def fit(self, textos: list[str], y: list[str]) -> "ModeloAtalho":
        contagem = Counter(primeira_palavra(t) for t in textos)
        contagem.pop(None, None)
        self.primeiras = [p for p, _ in contagem.most_common(N_PRIMEIRAS)]
        self.nomes = [*variaveis_de_forma(""), *(f"1a_{p}" for p in self.primeiras), "1a_outra"]
        X = self._matriz(textos)
        self.escala = StandardScaler().fit(X)
        self.regressao = LogisticRegression(max_iter=2000, class_weight="balanced")
        self.regressao.fit(self.escala.transform(X), y)
        return self

    def _matriz(self, textos: list[str]) -> np.ndarray:
        indice = {p: i for i, p in enumerate(self.primeiras)}
        linhas = []
        for texto in textos:
            uma_quente = [0.0] * (len(self.primeiras) + 1)
            uma_quente[indice.get(primeira_palavra(texto), len(self.primeiras))] = 1.0
            linhas.append([float(v) for v in variaveis_de_forma(texto).values()] + uma_quente)
        return np.array(linhas)

    @property
    def classes(self) -> list[str]:
        return list(self.regressao.classes_)

    def predict_proba(self, textos: list[str]) -> np.ndarray:
        return self.regressao.predict_proba(self.escala.transform(self._matriz(textos)))

    def pesos(self, n: int = N_PESOS) -> list[dict]:
        """As n variáveis de maior peso (em módulo, em qualquer classe), com o peso por classe."""
        coef = self.regressao.coef_
        if coef.shape[0] == 1:  # com duas classes, o sklearn guarda um vetor só
            coef = np.vstack([-coef[0], coef[0]])
        ordem = np.argsort(-np.abs(coef).max(axis=0))[:n]
        return [
            {
                "variavel": self.nomes[j],
                **{c: round(float(coef[i, j]), 3) for i, c in enumerate(self.classes)},
            }
            for j in ordem
        ]


def auc(modelo: ModeloAtalho, textos: list[str], y: list[str]) -> dict:
    """AUC de cada classe contra o resto e a média delas (AUC macro, como o `ovr` do sklearn).

    Classes sem exemplo no split, ou que são o split inteiro, ficam de fora da média.
    """
    proba = modelo.predict_proba(textos)
    y = np.array(y)
    por_classe = {}
    for i, classe in enumerate(modelo.classes):
        alvo = y == classe
        if 0 < alvo.sum() < len(y):
            por_classe[classe] = round(float(roc_auc_score(alvo, proba[:, i])), 3)
    macro = round(float(np.mean(list(por_classe.values()))), 3) if por_classe else None
    return {"registros": len(y), "auc_macro": macro, "auc_por_classe": por_classe}


def amostras(registros: Iterable[dict], campo: str) -> dict[str, tuple[list[str], list[str]]]:
    """Por split, os textos não vazios do campo e a veracidade."""
    por_split = {s: ([], []) for s in SPLITS}
    for r in registros:
        texto = (r.get(campo) or "").strip()
        if texto and r["split_produto"] in por_split and r["veracidade"] in CLASSES:
            por_split[r["split_produto"]][0].append(texto)
            por_split[r["split_produto"]][1].append(r["veracidade"])
    return por_split


def rodar(registros: list[dict], campo: str) -> dict:
    """Treina no treino e mede a AUC em cada split."""
    dados = amostras(registros, campo)
    textos, y = dados["treino"]
    if len(set(y)) < 2:
        raise ValueError(f"Treino de '{campo}' sem pelo menos duas classes.")
    modelo = ModeloAtalho().fit(textos, y)
    return {
        "campo": campo,
        "splits": {s: auc(modelo, *dados[s]) for s in SPLITS if dados[s][0]},
        "pesos": modelo.pesos(),
    }


def carregar_registros(caminho: Path = DATASET, com_portal: bool = False) -> list[dict]:
    """Registros do protocolo B (treino, validação e teste), sem portais por padrão (#7)."""
    registros = []
    with open(caminho, encoding="utf-8") as entrada:
        for linha in entrada:
            r = json.loads(linha)
            if r["split_produto"] in SPLITS and (com_portal or r["origem_rotulo"] != "portal"):
                registros.append(r)
    return registros


def imprimir(resultado: dict) -> None:
    for versao, saida in resultado["versoes"].items():
        print(f"\n{versao} ({saida['campo']})   0,5 = acaso; 1,0 = separa tudo só pela forma")
        print(
            f"  {'split':10} {'registros':>9} {'macro':>6}  "
            + "  ".join(f"{c:>10}" for c in CLASSES)
        )
        for split, m in saida["splits"].items():
            classes = "  ".join(
                f"{m['auc_por_classe'].get(c, float('nan')):10.3f}" for c in CLASSES
            )
            print(f"  {split:10} {m['registros']:9} {m['auc_macro']:6.3f}  {classes}")
        print(f"  {N_PESOS} variáveis de maior peso:")
        for p in saida["pesos"]:
            pesos = "  ".join(f"{c} {p[c]:+.2f}" for c in CLASSES if c in p)
            print(f"    {p['variavel']:22} {pesos}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--dataset", type=Path, default=DATASET)
    parser.add_argument("--prompt", type=Path, help="prompt da padronização (#20), para comparar")
    parser.add_argument("--com-portal", action="store_true", help="inclui os portais (notebook)")
    parser.add_argument("--saida", type=Path, default=SAIDA)
    args = parser.parse_args()

    if not args.dataset.exists():
        sys.exit(f"{args.dataset} não encontrado. Rode antes: make dados")
    registros = carregar_registros(args.dataset, args.com_portal)
    resultado = {"dataset": str(args.dataset.name), "com_portal": args.com_portal, "versoes": {}}
    resultado["versoes"]["original"] = rodar(registros, "texto_curto")

    if args.prompt:
        prompt = carregar_prompt(args.prompt)
        cache = ler_cache(caminho_cache(prompt.versao), prompt)
        if not cache:
            sys.exit(f"Cache da padronização {prompt.versao} vazio. Rode antes: make padronizar")
        padronizados = list(aplicar(registros, cache))
        resultado["prompt"] = {"versao": prompt.versao, "sha1": prompt.sha1}
        resultado["versoes"]["padronizado"] = rodar(padronizados, "texto_padronizado")
        mesmos = [r for r in padronizados if r["texto_padronizado"]]
        resultado["versoes"]["original_mesmos_registros"] = rodar(mesmos, "texto_curto")

    imprimir(resultado)
    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nGravado {args.saida}")


if __name__ == "__main__":
    main()
