"""Regras de pontuação e tempo da partida.

Valores iniciais para o MVP; ajuste aqui quando o grupo fechar as regras.
"""

MATCH_DURATION_SECONDS = 120
# Tolerância para a latência entre o fim do timer no front e a chegada da resposta.
ANSWER_GRACE_SECONDS = 5

POINTS_PER_CORRECT_ANSWER = 10
# Consequência do erro na pontuação. A consequência na mecânica
# (ex.: a cobra diminuir) fica no front, em web/src/game.
POINTS_PER_WRONG_ANSWER = 0
