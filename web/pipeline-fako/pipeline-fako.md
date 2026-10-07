# Pipeline FAKO

## Decisões

### Mecânica de resposta do jogo

**Decisão:** o FAKO adotará três níveis de veracidade para as respostas:

- `falso`
- `enganoso`
- `verdadeiro`

A veracidade será o contrato utilizado entre a classificação da IA, a API e o frontend.

O campo booleano `is_true` será substituído por um campo de veracidade baseado nesses três níveis.

A escala numérica de 0 a 100 não será utilizada como mecanismo de resposta do jogador. Quando disponível, ela será utilizada como informação complementar da análise da IA.

Questões classificadas como `enganoso` poderão ser utilizadas no jogo.

Essa decisão afeta as issues:

- #23 — Geração e publicação automática de questões
- #25 — Devolver a análise ao jogador depois da resposta
- #30 — Conectar o jogo à API
