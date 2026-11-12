export interface CaseOutcome { n: string; title: string; desc: string; }
export interface CaseSection { h: string; body: string; }
export interface CaseDecision { title: string; body: string; }

export interface Case {
  slug: string;
  legacyId: string;
  cat: string;
  title: string;
  subtitle: string;
  img: string;
  imgW: number;
  imgH: number;
  year: string;
  role: string;
  company: string;
  duration: string;
  keywords: string[];
  achievements: string[];
  outcomes: CaseOutcome[];
  sections: CaseSection[];
  quote: string;
  /* The 30-second summary, shown on the case page and on the password gate. */
  problem: string;
  cut: string;
  shipped: string;
  result: string;
  /* Big number + label on the Work index card. */
  cardNum: string;
  cardLabel: string;
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
    subtitle: 'Custom registration fields and branding for StreamYard On-Air webinars. Within four months, one in three webinars used them.',
    img: '/assets/images/case-namecheap.avif', imgW: 1600, imgH: 775,
    year: '2023', role: 'Senior / Staff Product Designer', company: 'StreamYard', duration: '4 months',
    keywords: ['Webinar UX', 'Customization', 'Design Systems', 'User Research', 'Figma'],
    achievements: [],
    outcomes: [
      { n: '32.9%', title: 'Adoption', desc: 'of webinars used custom fields, four months after release' },
      { n: '6,000+', title: 'Fields created', desc: 'custom registration fields in four months' },
      { n: '3×', title: 'Weekly webinars', desc: 'from about 200 to about 600 a week' },
    ],
    sections: [],
    quote: '',
    problem: "Hosts couldn't make their webinars look on-brand, and registration only collected a name and an email.",
    cut: "A full page builder. It meant building a layout engine our timeline didn't have, so we shipped templates where one colour choice generates the whole palette.",
    shipped: 'Branding with small live previews, then a full settings page with five custom registration fields.',
    result: '32.9% of webinars used custom fields within four months, and weekly webinars went from about 200 to about 600.',
    cardNum: '3×', cardLabel: 'weekly webinars after launch',
    decisions: [
      { title: 'Templates before a page builder', body: 'Full WYSIWYG would have meant building a website builder. Templates with a few properties (colour, font, logo) got value to hosts fast and freed engineering for registration fields.' },
      { title: 'One colour, the whole palette', body: 'Picking one brand colour generates the full webinar palette, with rules that keep buttons and backgrounds accessible.' },
      { title: 'From a modal to a settings page', body: '78% of hosts used branding in the first three weeks. That data backed a full settings page with subpages, with room for what was next on the roadmap.' },
    ],
  },
  {
    slug: 'understanding-webinar-organizers',
    legacyId: 'case-research',
    cat: 'Research Ops · StreamYard',
    title: 'Understanding webinar organizers',
    subtitle: "StreamYard's first major study of webinar organisers: interviews with 11 experienced organisers, concept tests, and a journey map the whole company used.",
    img: '/assets/images/case-research.avif', imgW: 1522, imgH: 964,
    year: '2022', role: 'Staff Product Designer, research co-lead', company: 'StreamYard', duration: '3 months',
    keywords: ['Research Ops', 'Moderated Testing', 'Surveys', 'Segmentation', 'Insight Repository'],
    achievements: [],
    outcomes: [
      { n: '1st', title: 'Knowledge base', desc: 'of foundational webinar insights in the company' },
      { n: '2', title: 'Teams briefed', desc: 'Growth and Library, with cross-team data' },
      { n: '5', title: 'Insights in use', desc: 'feeding ongoing product work' },
    ],
    sections: [],
    quote: '',
    problem: 'A year after launch, the webinar roadmap was scored from sales calls and support tickets, with no long-term picture of the people organising webinars.',
    cut: 'Our own users. We recruited experienced organisers who paid for competing tools, to hear what we were missing.',
    shipped: 'Interviews with a concept test in each one, synthesised in Dovetail into a five-stage journey map, presented to the whole company.',
    result: "The company's first shared knowledge base on webinar organisers. Two other teams were briefed, and the Growth team turned insights into new tests.",
    cardNum: '1st', cardLabel: 'company-wide study of webinar organisers',
    decisions: [
      { title: 'Recruit outside our user base', body: 'A screener on User Interviews found 11 organisers from healthcare, education and corporate comms who were paying for similar tools.' },
      { title: 'A concept test in every interview', body: 'Twenty minutes of each session went to a user scenario with a feature concept. The positive response gave us the confidence to build it.' },
      { title: 'A journey map, not a report', body: 'Five stages, from planning to repurposing, built to grow over time and split by segment.' },
    ],
  },
  {
    slug: 'leading-and-managing-a-design-system',
    legacyId: 'case-ds',
    cat: 'Design Leadership · StreamYard',
    title: 'Leading and managing a design system',
    subtitle: "Leading a design system across six StreamYard product teams to bring Figma and code back in line, until the company's sale halted the project.",
    img: '/assets/images/case-ds.avif', imgW: 1440, imgH: 900,
    year: '2022–2023', role: 'Lead designer and design system manager', company: 'StreamYard', duration: '10 months',
    keywords: ['Design System', 'Component Library', 'Figma', 'Accessibility', 'Tokens', 'Engineering Collaboration'],
    achievements: [],
    outcomes: [
      { n: '6', title: 'Teams', desc: 'united into one design system team and roadmap' },
      { n: '15+', title: 'Components', desc: 'designed and documented' },
      { n: '3', title: 'Improvements', desc: 'WCAG AA and design-to-code sync (partial), dark mode (upcoming)' },
    ],
    sections: [],
    quote: '',
    problem: 'Designs and code had drifted apart. Some components existed in five or more versions, and designers and engineers kept rebuilding them.',
    cut: 'New headcount and a big-bang rebuild. A contribution model let designers from six teams propose components through fixed checkpoints.',
    shipped: 'Tokens, 15+ fully specified components, a weekly sync, and theming that switches light and dark with one setting.',
    result: "Six teams on one roadmap, with partial WCAG AA and design-to-code sync before the company's sale stopped the project.",
    cardNum: '6', cardLabel: 'product teams on one design system',
    decisions: [
      { title: 'A contribution model, not a central team', body: 'There was no budget to grow the team, so designers across six teams contributed through checkpoints from idea to adoption.' },
      { title: 'Progress everyone could see', body: 'OKRs for designers and engineers, a weekly sync, and a quarter-at-a-glance view kept six teams moving together.' },
      { title: 'Tokens first', body: 'Scoped variables meant the whole theme could switch between light and dark with one setting.' },
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
    img: '/assets/images/case-talkdesk.avif', imgW: 778, imgH: 516,
    year: '2021', role: 'Senior Product Designer', company: 'Talkdesk', duration: '9 months',
    keywords: ['AI/ML UX', 'Enterprise SaaS', 'Information Architecture', 'Complex Workflows', 'B2B'],
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
    subtitle: 'An in-house support chat and agent app for Namecheap, designed from scratch with its own design system. 97.4% positive feedback four months after launch.',
    img: '/assets/images/case-webinar.avif', imgW: 1230, imgH: 1056,
    year: '2019–2020', role: 'Lead product designer', company: 'Namecheap', duration: '10 months',
    keywords: ['Customer Support', 'Internal Tools', 'Chat UX', 'Engineering Platform', 'B2B2C'],
    achievements: [],
    outcomes: [
      { n: '28.9%', title: 'More chats', desc: 'from 15k to 21k in four months' },
      { n: '4,800+', title: 'Chats rated', desc: 'over 15% more than before launch' },
      { n: '97.4%', title: 'Positive', desc: 'feedback on the new chat experience' },
    ],
    sections: [],
    quote: '',
    problem: 'Support agents handled five or more chats across 20+ browser tabs in a dated tool, and customers struggled to reach chat without their account details.',
    cut: 'The separate chat window. The chat became a floating widget that stays with you while you browse.',
    shipped: 'A themeable chat widget, an agent app, and a white-label design system for namecheap.com and ssls.com.',
    result: 'Chats grew 28.9% in four months (15k to 21k), and 97.4% of feedback was positive.',
    cardNum: '97.4%', cardLabel: 'positive feedback four months after launch',
    decisions: [
      { title: 'Start with the agents', body: 'I went to the support HQ in Ukraine to shadow agents, supervisors and managers before designing anything.' },
      { title: 'A widget, not a window', body: "The old tool opened a separate OS window. The new chat floats over the page, so customers don't lose their place." },
      { title: 'White-label from day one', body: 'Two themes from the start (namecheap.com and ssls.com), with status tokens and per-brand palettes.' },
    ],
  },
];
