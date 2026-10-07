import { Question, CategoryFilter } from "../types";

/**
 * Banco de perguntas do FAKO (15 afirmações curadas).
 * Todas as perguntas passam por validação humana com referências científicas e institucionais.
 * No futuro, a função nextQuestion() poderá consultar um endpoint REST ou banco de dados.
 */
export const QUESTIONS_DB: Question[] = [
  {
    id: "saude-01",
    categoria: "Saúde",
    afirmacao: "Tomar megadoses diárias de vitamina C impede a infecção pelo vírus do resfriado comum.",
    confiabilidade_referencia: 10,
    explicacao: "Revisões sistemáticas da biblioteca Cochrane apontam que a vitamina C não reduz o número de resfriados na população geral, podendo no máximo encurtar ligeiramente o tempo dos sintomas.",
    fonte: "Revisão Sistemática Cochrane / Organização Mundial da Saúde (OMS)"
  },
  {
    id: "saude-02",
    categoria: "Saúde",
    afirmacao: "Dormir de 7 a 9 horas por noite é crucial para a fixação de memória e renovação neural em adultos.",
    confiabilidade_referencia: 95,
    explicacao: "Durante as fases de sono profundo e REM, o cérebro processa os dados aprendidos no dia e realiza a limpeza de subprodutos metabólicos acumulados.",
    fonte: "National Sleep Foundation / Fiocruz"
  },
  {
    id: "saude-03",
    categoria: "Saúde",
    afirmacao: "Tomar água morna com limão pela manhã em jejum 'desintoxica' o fígado e derrete gordura corporal.",
    confiabilidade_referencia: 5,
    explicacao: "O fígado e os rins já filtram e eliminam toxinas de forma autônoma. O limão fornece nutrientes saudáveis como vitamina C, mas não possui propriedades desintoxicantes milagrosas ou emagrecedoras.",
    fonte: "Sociedade Brasileira de Nutrição"
  },
  {
    id: "saude-04",
    categoria: "Saúde",
    afirmacao: "A prática regular de exercícios físicos moderados reduz sintomas de estresse e melhora o equilíbrio mental.",
    confiabilidade_referencia: 95,
    explicacao: "A atividade física induz a liberação de neurotransmissores como endorfina e serotonina, diminui o cortisol e estimula a neuroplasticidade.",
    fonte: "Organização Mundial da Saúde (OMS)"
  },
  {
    id: "saude-05",
    categoria: "Saúde",
    afirmacao: "Ler em ambientes com iluminação fraca causa danos irreversíveis aos olhos e provoca miopia.",
    confiabilidade_referencia: 15,
    explicacao: "A baixa luminosidade pode cansar os músculos oculares e causar dor de cabeça temporária (fadiga visual), mas não danifica a estrutura do globo ocular nem causa miopia permanente.",
    fonte: "Academia Americana de Oftalmologia"
  },
  {
    id: "tec-01",
    categoria: "Tecnologia",
    afirmacao: "Navegar em 'aba anônima' impede que o seu provedor de internet ou operadora veja os sites que você visita.",
    confiabilidade_referencia: 10,
    explicacao: "A navegação anônima não guarda histórico, cookies e senhas apenas no seu aparelho local. Seu provedor, administrador da rede e os próprios servidores visitados continuam recebendo todas as requisições.",
    fonte: "Mozilla Foundation / Google Chrome Support"
  },
  {
    id: "tec-02",
    categoria: "Tecnologia",
    afirmacao: "Uma senha longa no formato 'frase de segurança' costuma ser mais resistente a ataques de força bruta do que uma senha curta com caracteres aleatórios.",
    confiabilidade_referencia: 90,
    explicacao: "O comprimento total da senha eleva exponencialmente a quantidade de combinações possíveis (entropia matemática), tornando inviável o teste por computadores em tempo hábil.",
    fonte: "NIST Special Publication 800-63B"
  },
  {
    id: "tec-03",
    categoria: "Tecnologia",
    afirmacao: "O ícone de cadeado (HTTPS) ao lado do endereço do site assegura que a empresa por trás da página é 100% confiável e livre de fraudes.",
    confiabilidade_referencia: 20,
    explicacao: "O certificado HTTPS garante unicamente que a troca de dados entre seu navegador e aquele servidor é criptografada. Golpistas e páginas falsas (phishing) podem facilmente obter certificados válidos.",
    fonte: "Electronic Frontier Foundation (EFF)"
  },
  {
    id: "tec-04",
    categoria: "Tecnologia",
    afirmacao: "Reiniciar computadores e roteadores periodicamente limpa o lixo de memória RAM e corrige travamentos causados por vazamento de recursos.",
    confiabilidade_referencia: 90,
    explicacao: "O reinício limpa tabelas de conexões pendentes, finaliza processos orfãos em background e zera o estado de memória volátil, restabelecendo a operação ideal.",
    fonte: "Agência de Segurança Nacional (NSA) / IEEE"
  },
  {
    id: "tec-05",
    categoria: "Tecnologia",
    afirmacao: "Smartphones gravam secretamente todo o áudio ambiente 24 horas por dia para direcionar anúncios de produtos falados em voz alta.",
    confiabilidade_referencia: 25,
    explicacao: "Análises de tráfego de rede comprovam que não há upload contínuo de gravações de voz. O direcionamento surpreendente de anúncios acontece pelo cruzamento de geolocalização compartilhada, contatos em comum, buscas e histórico de compras.",
    fonte: "MIT Technology Review / Pesquisas de Segurança de Redes da Universidade de Princeton"
  },
  {
    id: "gerais-01",
    categoria: "Conhecimentos Gerais",
    afirmacao: "Os seres humanos utilizam somente cerca de 10% da sua capacidade cerebral no cotidiano.",
    confiabilidade_referencia: 5,
    explicacao: "Esse é um mito popular muito antigo. Exames de ressonância magnética funcional e tomografia mostram que quase 100% das áreas do cérebro têm atividade contínua ao longo de um dia normal.",
    fonte: "Scientific American / Sociedade Brasileira de Neurociências"
  },
  {
    id: "gerais-02",
    categoria: "Conhecimentos Gerais",
    afirmacao: "A Grande Muralha da China é visível a olho nu por astronautas orbitando a Terra.",
    confiabilidade_referencia: 10,
    explicacao: "A largura média da muralha é de poucos metros e seus materiais têm coloração idêntica ao relevo vizinho. Sem binóculos ou lentes de aumento telescópicas, não é possível distingui-la a olho nu da órbita.",
    fonte: "NASA Earth Observatory"
  },
  {
    id: "gerais-03",
    categoria: "Conhecimentos Gerais",
    afirmacao: "A cidade de Brasília foi oficialmente inaugurada como a nova capital do Brasil no ano de 1960.",
    confiabilidade_referencia: 100,
    explicacao: "Construída durante a presidência de Juscelino Kubitschek, Brasília foi inaugurada com grande solenidade no dia 21 de abril de 1960, substituindo a cidade do Rio de Janeiro.",
    fonte: "Arquivo Público do Distrito Federal / Arquivo Nacional"
  },
  {
    id: "gerais-04",
    categoria: "Conhecimentos Gerais",
    afirmacao: "Um raio elétrico nunca atinge a mesma região geográfica ou edifício mais de uma vez.",
    confiabilidade_referencia: 5,
    explicacao: "Estruturas altas e condutoras como o monumento do Cristo Redentor no Rio de Janeiro ou o Empire State Building em Nova York são atingidas dezenas de vezes por descargas a cada tempestade.",
    fonte: "Grupo de Eletricidade Atmosférica do INPE (ELAT)"
  },
  {
    id: "gerais-05",
    categoria: "Conhecimentos Gerais",
    afirmacao: "Resíduos plásticos descartados na natureza se fragmentam em microplásticos que já foram identificados na água potável e no corpo humano.",
    confiabilidade_referencia: 95,
    explicacao: "Inúmeros estudos acadêmicos e relatórios ambientais comprovaram que partículas micrométricas de polímeros agora estão presentes nos oceanos, na chuva e em órgãos humanos como pulmões e sangue.",
    fonte: "Programa das Nações Unidas para o Meio Ambiente (PNUMA) / Revista Nature"
  }
];

class QuestionDeckManager {
  private deck: Question[] = [];
  private currentFilter: CategoryFilter = "Misto";

  constructor() {
    this.refillDeck();
  }

  public refillDeck(filter: CategoryFilter = "Misto") {
    this.currentFilter = filter;
    let pool = [...QUESTIONS_DB];
    if (filter !== "Misto") {
      pool = pool.filter((q) => q.categoria === filter);
    }
    // Embaralha o pool
    this.deck = pool.sort(() => Math.random() - 0.5);
  }

  /**
   * Retorna a próxima pergunta do baralho.
   */
  public nextQuestion(filter?: CategoryFilter): Question {
    if (filter && filter !== this.currentFilter) {
      this.refillDeck(filter);
    }

    if (this.deck.length === 0) {
      this.refillDeck(this.currentFilter);
    }

    const q = this.deck.pop();
    if (q) return q;

    // Fallback
    return QUESTIONS_DB[0];
  }

  public reset(filter: CategoryFilter = "Misto") {
    this.refillDeck(filter);
  }
}

const questionManager = new QuestionDeckManager();

export function nextQuestion(filter?: CategoryFilter): Question {
  return questionManager.nextQuestion(filter);
}

export function resetQuestionDeck(filter: CategoryFilter = "Misto"): void {
  questionManager.reset(filter);
}
