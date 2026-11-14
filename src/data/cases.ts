/* Every translatable field X has an optional Portuguese sibling XPt
   (rendered through data-pt). */
export interface CaseOutcome { n: string; nPt?: string; title: string; titlePt?: string; desc: string; descPt?: string; }
export interface CaseSection { h: string; hPt?: string; body: string; bodyPt?: string; }
export interface CaseDecision { title: string; titlePt?: string; body: string; bodyPt?: string; }

export interface Case {
  slug: string;
  legacyId: string;
  cat: string;
  catPt?: string;
  title: string;
  titlePt?: string;
  subtitle: string;
  subtitlePt?: string;
  img: string;
  imgW: number;
  imgH: number;
  year: string;
  yearPt?: string;
  role: string;
  rolePt?: string;
  company: string;
  duration: string;
  durationPt?: string;
  keywords: string[];
  keywordsPt?: string[];
  achievements: string[];
  achievementsPt?: string[];
  outcomes: CaseOutcome[];
  sections: CaseSection[];
  quote: string;
  quotePt?: string;
  /* The 30-second summary, shown on the case page and on the password gate. */
  problem: string;
  problemPt?: string;
  cut: string;
  cutPt?: string;
  shipped: string;
  shippedPt?: string;
  result: string;
  resultPt?: string;
  /* Big number + label on the Work index card. */
  cardNum: string;
  cardNumPt?: string;
  cardLabel: string;
  cardLabelPt?: string;
  /* Three decisions, shown under the summary. */
  decisions: CaseDecision[];
  /* Hidden cases are not built at all: no page, no sitemap entry, no
     index card, no next-case link. Flip to false (or remove) to surface
     again once the data is real. */
  hidden?: boolean;
}

export const CASES: Case[] = [
  {
    slug: 'redefining-webinar-customization',
    legacyId: 'case-webinar',
    cat: 'Design · StreamYard',
    title: 'Redefining webinar customization',
    catPt: 'Design · StreamYard',
    titlePt: 'Redefinir a personalização de webinars',
    subtitle: 'Custom registration fields and branding for StreamYard On-Air webinars. Within four months, one in three webinars used them.',
    subtitlePt: 'Campos de registo e marca personalizados nos webinars On-Air da StreamYard. Em quatro meses, um em cada três webinars já os usava.',
    img: '/assets/images/case-namecheap.avif', imgW: 1600, imgH: 775,
    year: '2023', role: 'Senior / Staff Product Designer', company: 'StreamYard', duration: '4 months',
    rolePt: 'Senior / Staff Product Designer', durationPt: '4 meses',
    keywords: ['Webinar UX', 'Customization', 'Design Systems', 'User Research', 'Figma'],
    keywordsPt: ['UX de webinars', 'Personalização', 'Design systems', 'Pesquisa com utilizadores', 'Figma'],
    achievements: [],
    outcomes: [
      { n: '32.9%', nPt: '32,9%', title: 'Adoption', titlePt: 'Adoção', desc: 'of webinars used custom fields, four months after release', descPt: 'dos webinars usaram campos personalizados, quatro meses após o lançamento' },
      { n: '6,000+', nPt: '6000+', title: 'Fields created', titlePt: 'Campos criados', desc: 'custom registration fields in four months', descPt: 'campos de registo personalizados em quatro meses' },
      { n: '3×', title: 'Weekly webinars', titlePt: 'Webinars semanais', desc: 'from about 200 to about 600 a week', descPt: 'de cerca de 200 para cerca de 600 por semana' },
    ],
    sections: [],
    quote: '',
    problem: "Hosts couldn't make their webinars look on-brand, and registration only collected a name and an email.",
    problemPt: 'Os organizadores não conseguiam pôr os webinars com a cara da marca, e o registo só recolhia um nome e um email.',
    cut: "A full page builder. It meant building a layout engine our timeline didn't have, so we shipped templates where one colour choice generates the whole palette.",
    cutPt: 'Um page builder completo. Obrigava a construir um motor de layouts que o nosso prazo não permitia, por isso lançámos templates em que uma só escolha de cor gera toda a paleta.',
    shipped: 'Branding with small live previews, then a full settings page with five custom registration fields.',
    shippedPt: 'Marca com pequenas pré-visualizações em direto e, depois, uma página de definições completa com cinco campos de registo personalizados.',
    result: '32.9% of webinars used custom fields within four months, and weekly webinars went from about 200 to about 600.',
    resultPt: '32,9% dos webinars usaram campos personalizados em quatro meses, e os webinars semanais passaram de cerca de 200 para cerca de 600.',
    cardNum: '3×', cardLabel: 'weekly webinars after launch',
    cardLabelPt: 'webinars semanais após o lançamento',
    decisions: [
      { title: 'Templates before a page builder', titlePt: 'Templates antes de um page builder', body: 'Full WYSIWYG would have meant building a website builder. Templates with a few properties (colour, font, logo) got value to hosts fast and freed engineering for registration fields.', bodyPt: 'Um WYSIWYG completo seria construir um website builder. Templates com poucas propriedades (cor, tipo de letra, logótipo) deram valor aos organizadores depressa e libertaram a engenharia para os campos de registo.' },
      { title: 'One colour, the whole palette', titlePt: 'Uma cor, a paleta toda', body: 'Picking one brand colour generates the full webinar palette, with rules that keep buttons and backgrounds accessible.', bodyPt: 'Escolher uma cor de marca gera a paleta completa do webinar, com regras que mantêm botões e fundos acessíveis.' },
      { title: 'From a modal to a settings page', titlePt: 'De um modal para uma página de definições', body: '78% of hosts used branding in the first three weeks. That data backed a full settings page with subpages, with room for what was next on the roadmap.', bodyPt: '78% dos organizadores usaram a marca nas primeiras três semanas. Esses dados sustentaram uma página de definições completa, com subpáginas e espaço para o que vinha a seguir no roadmap.' },
    ],
  },
  {
    slug: 'understanding-webinar-organizers',
    legacyId: 'case-research',
    cat: 'Research Ops · StreamYard',
    title: 'Understanding webinar organizers',
    catPt: 'Research Ops · StreamYard',
    titlePt: 'Perceber quem organiza webinars',
    subtitle: "StreamYard's first major study of webinar organisers: interviews with 11 experienced organisers, concept tests, and a journey map the whole company used.",
    subtitlePt: 'O primeiro grande estudo da StreamYard sobre organizadores de webinars: entrevistas com 11 organizadores experientes, testes de conceito e um mapa de jornada que a empresa inteira usou.',
    img: '/assets/images/case-research.avif', imgW: 1522, imgH: 964,
    year: '2022', role: 'Staff Product Designer, research co-lead', company: 'StreamYard', duration: '3 months',
    rolePt: 'Staff Product Designer, co-responsável pela pesquisa', durationPt: '3 meses',
    keywords: ['Research Ops', 'Moderated Testing', 'Surveys', 'Segmentation', 'Insight Repository'],
    keywordsPt: ['Research Ops', 'Testes moderados', 'Inquéritos', 'Segmentação', 'Repositório de insights'],
    achievements: [],
    outcomes: [
      { n: '1st', nPt: '1.ª', title: 'Knowledge base', titlePt: 'Base de conhecimento', desc: 'of foundational webinar insights in the company', descPt: 'de insights fundamentais sobre webinars na empresa' },
      { n: '2', title: 'Teams briefed', titlePt: 'Equipas informadas', desc: 'Growth and Library, with cross-team data', descPt: 'Growth e Library, com dados entre equipas' },
      { n: '5', title: 'Insights in use', titlePt: 'Insights em uso', desc: 'feeding ongoing product work', descPt: 'a alimentar o trabalho de produto em curso' },
    ],
    sections: [],
    quote: '',
    problem: 'A year after launch, the webinar roadmap was scored from sales calls and support tickets, with no long-term picture of the people organising webinars.',
    problemPt: 'Um ano após o lançamento, o roadmap de webinars era pontuado com base em chamadas de vendas e tickets de suporte, sem uma visão de longo prazo de quem organizava webinars.',
    cut: 'Our own users. We recruited experienced organisers who paid for competing tools, to hear what we were missing.',
    cutPt: 'Os nossos próprios utilizadores. Recrutámos organizadores experientes que pagavam por ferramentas concorrentes, para perceber o que nos escapava.',
    shipped: 'Interviews with a concept test in each one, synthesised in Dovetail into a five-stage journey map, presented to the whole company.',
    shippedPt: 'Entrevistas com um teste de conceito em cada uma, sintetizadas no Dovetail num mapa de jornada de cinco fases, apresentado à empresa inteira.',
    result: "The company's first shared knowledge base on webinar organisers. Two other teams were briefed, and the Growth team turned insights into new tests.",
    resultPt: 'A primeira base de conhecimento partilhada da empresa sobre organizadores de webinars. Duas outras equipas foram informadas, e a equipa de Growth transformou insights em novos testes.',
    cardNum: '1st', cardLabel: 'company-wide study of webinar organisers',
    cardNumPt: '1.º', cardLabelPt: 'estudo à escala da empresa sobre organizadores de webinars',
    decisions: [
      { title: 'Recruit outside our user base', titlePt: 'Recrutar fora da nossa base de utilizadores', body: 'A screener on User Interviews found 11 organisers from healthcare, education and corporate comms who were paying for similar tools.', bodyPt: 'Um questionário de seleção no User Interviews encontrou 11 organizadores da saúde, da educação e da comunicação empresarial que pagavam por ferramentas semelhantes.' },
      { title: 'A concept test in every interview', titlePt: 'Um teste de conceito em cada entrevista', body: 'Twenty minutes of each session went to a user scenario with a feature concept. The positive response gave us the confidence to build it.', bodyPt: 'Vinte minutos de cada sessão foram para um cenário de utilizador com um conceito de funcionalidade. A reação positiva deu-nos confiança para a construir.' },
      { title: 'A journey map, not a report', titlePt: 'Um mapa de jornada, não um relatório', body: 'Five stages, from planning to repurposing, built to grow over time and split by segment.', bodyPt: 'Cinco fases, do planeamento à reutilização, feito para crescer com o tempo e ser dividido por segmento.' },
    ],
  },
  {
    slug: 'leading-and-managing-a-design-system',
    legacyId: 'case-ds',
    cat: 'Design Leadership · StreamYard',
    title: 'Leading and managing a design system',
    catPt: 'Liderança de design · StreamYard',
    titlePt: 'Liderar e gerir um design system',
    subtitle: "Leading a design system across six StreamYard product teams to bring Figma and code back in line, until the company's sale halted the project.",
    subtitlePt: 'Liderar um design system em seis equipas de produto da StreamYard para voltar a alinhar o Figma e o código, até a venda da empresa parar o projeto.',
    img: '/assets/images/case-ds.avif', imgW: 1440, imgH: 900,
    year: '2022–2023', role: 'Lead designer and design system manager', company: 'StreamYard', duration: '10 months',
    rolePt: 'Lead designer e responsável pelo design system', durationPt: '10 meses',
    keywords: ['Design System', 'Component Library', 'Figma', 'Accessibility', 'Tokens', 'Engineering Collaboration'],
    keywordsPt: ['Design system', 'Biblioteca de componentes', 'Figma', 'Acessibilidade', 'Tokens', 'Colaboração com engenharia'],
    achievements: [],
    outcomes: [
      { n: '6', title: 'Teams', titlePt: 'Equipas', desc: 'united into one design system team and roadmap', descPt: 'unidas numa só equipa e roadmap de design system' },
      { n: '15+', title: 'Components', titlePt: 'Componentes', desc: 'designed and documented', descPt: 'desenhados e documentados' },
      { n: '3', title: 'Improvements', titlePt: 'Melhorias', desc: 'WCAG AA and design-to-code sync (partial), dark mode (upcoming)', descPt: 'WCAG AA e sincronização entre design e código (parcial), modo escuro (previsto)' },
    ],
    sections: [],
    quote: '',
    problem: 'Designs and code had drifted apart. Some components existed in five or more versions, and designers and engineers kept rebuilding them.',
    problemPt: 'Os designs e o código tinham-se afastado. Alguns componentes existiam em cinco ou mais versões, e designers e engenheiros estavam sempre a reconstruí-los.',
    cut: 'New headcount and a big-bang rebuild. A contribution model let designers from six teams propose components through fixed checkpoints.',
    cutPt: 'Contratações novas e uma reconstrução total de uma só vez. Um modelo de contribuição deixou designers de seis equipas propor componentes através de pontos de controlo fixos.',
    shipped: 'Tokens, 15+ fully specified components, a weekly sync, and theming that switches light and dark with one setting.',
    shippedPt: 'Tokens, mais de 15 componentes totalmente especificados, uma sync semanal e temas que alternam entre claro e escuro com uma só definição.',
    result: "Six teams on one roadmap, with partial WCAG AA and design-to-code sync before the company's sale stopped the project.",
    resultPt: 'Seis equipas num só roadmap, com WCAG AA e sincronização entre design e código parciais antes de a venda da empresa parar o projeto.',
    cardNum: '6', cardLabel: 'product teams on one design system',
    cardLabelPt: 'equipas de produto num só design system',
    decisions: [
      { title: 'A contribution model, not a central team', titlePt: 'Um modelo de contribuição, não uma equipa central', body: 'There was no budget to grow the team, so designers across six teams contributed through checkpoints from idea to adoption.', bodyPt: 'Não havia orçamento para aumentar a equipa, por isso designers de seis equipas contribuíram através de pontos de controlo, da ideia à adoção.' },
      { title: 'Progress everyone could see', titlePt: 'Progresso que todos viam', body: 'OKRs for designers and engineers, a weekly sync, and a quarter-at-a-glance view kept six teams moving together.', bodyPt: 'OKRs para designers e engenheiros, uma sync semanal e uma vista do trimestre num relance mantiveram seis equipas a avançar juntas.' },
      { title: 'Tokens first', titlePt: 'Primeiro os tokens', body: 'Scoped variables meant the whole theme could switch between light and dark with one setting.', bodyPt: 'Variáveis com âmbito definido permitiram mudar o tema inteiro entre claro e escuro com uma só definição.' },
    ],
  },
  {
    /* Not built: the old copy had invented numbers and a quote. Fields
       are blanked; refill with real data before un-hiding. */
    hidden: true,
    slug: 'reshaping-an-ai-training-platform',
    legacyId: 'case-talkdesk',
    cat: 'Design · Talkdesk',
    title: 'Reshaping an AI training platform',
    subtitle: "Redesigning the trainer interface for Talkdesk's AI platform.",
    catPt: 'Design · Talkdesk',
    titlePt: 'Redesenhar uma plataforma de treino de IA',
    subtitlePt: 'Redesenho da interface dos treinadores para a plataforma de IA da Talkdesk.',
    img: '/assets/images/case-talkdesk.avif', imgW: 778, imgH: 516,
    year: '2021', role: 'Senior Product Designer', company: 'Talkdesk', duration: '9 months',
    rolePt: 'Senior Product Designer', durationPt: '9 meses',
    keywords: ['AI/ML UX', 'Enterprise SaaS', 'Information Architecture', 'Complex Workflows', 'B2B'],
    keywordsPt: ['UX de IA/ML', 'SaaS empresarial', 'Arquitetura de informação', 'Fluxos complexos', 'B2B'],
    achievements: [],
    outcomes: [],
    sections: [],
    quote: '',
    problem: '', cut: '', shipped: '', result: '',
    cardNum: '', cardLabel: '',
    decisions: [],
  },
  {
    slug: 'designing-a-support-chat-experience',
    legacyId: 'case-namecheap',
    cat: 'Design · Namecheap',
    title: 'Designing a support chat experience',
    catPt: 'Design · Namecheap',
    titlePt: 'Desenhar uma experiência de chat de suporte',
    subtitle: 'An in-house support chat and agent app for Namecheap, designed from scratch with its own design system. 97.4% positive feedback four months after launch.',
    subtitlePt: 'Um chat de suporte e uma app para agentes feitos de raiz para a Namecheap, com um design system próprio. 97,4% de feedback positivo quatro meses após o lançamento.',
    img: '/assets/images/case-webinar.avif', imgW: 1230, imgH: 1056,
    year: '2019–2020', role: 'Lead product designer', company: 'Namecheap', duration: '10 months',
    rolePt: 'Lead product designer', durationPt: '10 meses',
    keywords: ['Customer Support', 'Internal Tools', 'Chat UX', 'Engineering Platform', 'B2B2C'],
    keywordsPt: ['Suporte ao cliente', 'Ferramentas internas', 'UX de chat', 'Plataforma de engenharia', 'B2B2C'],
    achievements: [],
    outcomes: [
      { n: '28.9%', nPt: '28,9%', title: 'More chats', titlePt: 'Mais chats', desc: 'from 15k to 21k in four months', descPt: 'de 15k para 21k em quatro meses' },
      { n: '4,800+', nPt: '4800+', title: 'Chats rated', titlePt: 'Chats avaliados', desc: 'over 15% more than before launch', descPt: 'mais de 15% do que antes do lançamento' },
      { n: '97.4%', nPt: '97,4%', title: 'Positive', titlePt: 'Positivo', desc: 'feedback on the new chat experience', descPt: 'de feedback sobre a nova experiência de chat' },
    ],
    sections: [],
    quote: '',
    problem: 'Support agents handled five or more chats across 20+ browser tabs in a dated tool, and customers struggled to reach chat without their account details.',
    problemPt: 'Os agentes de suporte geriam cinco ou mais chats em mais de 20 separadores do browser, numa ferramenta datada, e os clientes tinham dificuldade em chegar ao chat sem os dados da conta.',
    cut: 'The separate chat window. The chat became a floating widget that stays with you while you browse.',
    cutPt: 'A janela de chat separada. O chat passou a ser um widget flutuante que acompanha quem navega.',
    shipped: 'A themeable chat widget, an agent app, and a white-label design system for namecheap.com and ssls.com.',
    shippedPt: 'Um widget de chat com temas, uma app para agentes e um design system white-label para namecheap.com e ssls.com.',
    result: 'Chats grew 28.9% in four months (15k to 21k), and 97.4% of feedback was positive.',
    resultPt: 'Os chats cresceram 28,9% em quatro meses (de 15k para 21k), e 97,4% do feedback foi positivo.',
    cardNum: '97.4%', cardNumPt: '97,4%', cardLabel: 'positive feedback four months after launch',
    cardLabelPt: 'feedback positivo quatro meses após o lançamento',
    decisions: [
      { title: 'Start with the agents', titlePt: 'Começar pelos agentes', body: 'I went to the support HQ in Ukraine to shadow agents, supervisors and managers before designing anything.', bodyPt: 'Fui à sede do suporte, na Ucrânia, acompanhar agentes, supervisores e gestores antes de desenhar fosse o que fosse.' },
      { title: 'A widget, not a window', titlePt: 'Um widget, não uma janela', body: "The old tool opened a separate OS window. The new chat floats over the page, so customers don't lose their place.", bodyPt: 'A ferramenta antiga abria uma janela separada do sistema operativo. O novo chat flutua sobre a página, por isso os clientes não perdem o sítio onde estavam.' },
      { title: 'White-label from day one', titlePt: 'White-label desde o primeiro dia', body: 'Two themes from the start (namecheap.com and ssls.com), with status tokens and per-brand palettes.', bodyPt: 'Dois temas desde o início (namecheap.com e ssls.com), com tokens de estado e paletas por marca.' },
    ],
  },
];
