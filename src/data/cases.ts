export interface CaseOutcome { n: string; title: string; desc: string; }
export interface CaseSection { h: string; body: string; }

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
}

export const CASES: Case[] = [
  {
    slug: 'redefining-webinar-customization',
    legacyId: 'case-webinar',
    cat: 'Design · StreamYard',
    title: 'Redefining webinar customization',
    subtitle: "How I redesigned the end-to-end customization experience for StreamYard's webinar product, serving 5M+ live streaming users.",
    img: '/assets/images/case-webinar.avif', imgW: 1230, imgH: 1056,
    year: '2023', role: 'Senior Product Designer', company: 'StreamYard', duration: '6 months',
    keywords: ['Webinar UX', 'Customization', 'Design Systems', 'User Research', 'Figma'],
    achievements: [
      'Reduced time-to-publish for webinar organizers by ~40%',
      'Consolidated 3 fragmented customization flows into a single unified editor',
      'Shipped to 5M+ active StreamYard users with zero regression bugs',
    ],
    outcomes: [
      { n: '40%', title: 'Faster setup', desc: 'Reduction in time-to-publish for organizers' },
      { n: '5M+', title: 'Users reached', desc: 'Active StreamYard users impacted at launch' },
      { n: '0',   title: 'Regression bugs', desc: 'At launch — engineering/design co-design worked' },
    ],
    sections: [
      { h: 'The problem', body: 'Webinar organizers were navigating three separate panels to customize a single broadcast. The mental model was fragmented and error-prone — users frequently published with the wrong branding or missing assets.' },
      { h: 'My approach', body: 'I ran moderated usability sessions with 12 organizers across segments (solopreneurs, enterprise teams, educators). The insight was consistent: customization felt like configuration, not creation. We needed to shift the frame.' },
      { h: 'The solution', body: 'A unified "Brand Studio" — a persistent side panel with a live preview alongside edits. All assets, colors, and layouts in one place. Changes reflected in real-time across the broadcast canvas.' },
    ],
    quote: 'The new editor made webinar setup feel like building something, not filling out a form.',
  },
  {
    slug: 'understanding-webinar-organizers',
    legacyId: 'case-research',
    cat: 'Research Ops · StreamYard',
    title: 'Understanding webinar organizers',
    subtitle: "A research operations effort to build a continuous feedback loop with StreamYard's webinar segment — informing 12 months of product decisions.",
    img: '/assets/images/case-research.avif', imgW: 1522, imgH: 964,
    year: '2022', role: 'Senior Product Designer', company: 'StreamYard', duration: '3 months (ongoing)',
    keywords: ['Research Ops', 'Moderated Testing', 'Surveys', 'Segmentation', 'Insight Repository'],
    achievements: [
      'Established a recurring user panel of 40+ webinar organizers',
      'Delivered 6 research reports consumed by product, design, and marketing',
      'Reduced time from question to insight from 3 weeks to 5 days',
    ],
    outcomes: [
      { n: '40+',    title: 'Panel members', desc: 'Recurring participants across organizer segments' },
      { n: '6',      title: 'Reports delivered', desc: 'Consumed by product, design, and marketing' },
      { n: '5 days', title: 'Insight cycle', desc: 'Down from 3 weeks — faster decisions' },
    ],
    sections: [
      { h: 'The problem', body: 'Product decisions about the webinar segment were being made without direct user input. The team relied on NPS data and support tickets — lagging signals that told us what went wrong, not why.' },
      { h: 'What I built', body: 'A lightweight research ops system: a screened user panel, a reusable interview guide template, a shared Notion insight repository, and a monthly synthesis ritual that all PMs attended.' },
    ],
    quote: 'For the first time, we had a direct line to the people using our product — not just the data they left behind.',
  },
  {
    slug: 'leading-and-managing-a-design-system',
    legacyId: 'case-ds',
    cat: 'Design Leadership · StreamYard',
    title: 'Leading and managing a design system',
    subtitle: "How I built, scaled, and maintained a component library that became the single source of truth for StreamYard's design and engineering teams.",
    img: '/assets/images/case-ds.avif', imgW: 1440, imgH: 900,
    year: '2022–2023', role: 'Senior Product Designer', company: 'StreamYard', duration: '18 months',
    keywords: ['Design System', 'Component Library', 'Figma', 'Accessibility', 'Tokens', 'Engineering Collaboration'],
    achievements: [
      'Grew library from 40 to 200+ components with full Figma + code parity',
      'Reduced design-to-development handoff friction by an estimated 35%',
      'Onboarded 4 new designers with zero dedicated docs sessions',
    ],
    outcomes: [
      { n: '200+', title: 'Components', desc: 'Full Figma + code parity at ship' },
      { n: '35%',  title: 'Less friction', desc: 'Estimated reduction in handoff time' },
      { n: '4',    title: 'Designers onboarded', desc: 'Self-serve — no dedicated docs sessions' },
    ],
    sections: [
      { h: 'The challenge', body: 'StreamYard had grown fast. Design patterns had diverged across features, and engineers were implementing the same component six different ways. The design system existed in name only — a Figma file nobody fully trusted.' },
      { h: 'What I did', body: 'I audited the product, identified the 20 highest-leverage components, and rebuilt them from scratch with proper variants, states, and documentation. Then I worked directly with the lead engineer to establish a token system that bridged Figma and the codebase.' },
    ],
    quote: 'The design system became the single source of truth — reducing design debt and letting the team move faster with confidence.',
  },
  {
    slug: 'reshaping-an-ai-training-platform',
    legacyId: 'case-talkdesk',
    cat: 'Design · Talkdesk',
    title: 'Reshaping an AI training platform',
    subtitle: "Redesigning the trainer interface for Talkdesk's AI/CX platform — making it usable for non-technical users without losing power-user depth.",
    img: '/assets/images/case-talkdesk.avif', imgW: 778, imgH: 516,
    year: '2021', role: 'Senior Product Designer', company: 'Talkdesk', duration: '9 months',
    keywords: ['AI/ML UX', 'Enterprise SaaS', 'Information Architecture', 'Complex Workflows', 'B2B'],
    achievements: [
      'Reduced average training session setup time from 45 to 18 minutes',
      'Designed for two distinct user personas without a bifurcated interface',
      'Shipped as part of Talkdesk AI Trainer GA release',
    ],
    outcomes: [
      { n: '18 min', title: 'Setup time', desc: 'Down from 45 min average for new trainers' },
      { n: '2',      title: 'Personas served', desc: 'One interface, two experience levels' },
      { n: 'GA',     title: 'Shipped', desc: 'Part of Talkdesk AI Trainer general availability' },
    ],
    sections: [
      { h: 'The problem', body: 'The AI trainer was built for ML engineers. But the actual users were CX managers — people with deep domain expertise and zero machine learning background. The interface assumed knowledge it had no right to assume.' },
      { h: 'The approach', body: 'I mapped the mental model gap between expert and novice users. The redesign surfaced progressive disclosure — experts could go deep, beginners got guardrails. Labels were rewritten from technical jargon to task language.' },
    ],
    quote: "For the first time, I could actually do this myself. I didn't need to file a ticket.",
  },
  {
    slug: 'designing-a-support-chat-experience',
    legacyId: 'case-namecheap',
    cat: 'Design · Namecheap',
    title: 'Designing a support chat experience',
    subtitle: "Building a customer support platform from the ground up for Namecheap's engineering team — reducing ticket volume and improving resolution speed.",
    img: '/assets/images/case-namecheap.avif', imgW: 3124, imgH: 1512,
    year: '2019–2020', role: 'Product Designer', company: 'Namecheap', duration: '12 months',
    keywords: ['Customer Support', 'Internal Tools', 'Chat UX', 'Engineering Platform', 'B2B2C'],
    achievements: [
      'Designed end-to-end from discovery to shipped product',
      'Reduced average resolution time by 22% in the first quarter post-launch',
      'Adopted by 200+ support agents across three time zones',
    ],
    outcomes: [
      { n: '22%',  title: 'Faster resolution', desc: 'Average ticket resolution time in Q1 post-launch' },
      { n: '200+', title: 'Agents', desc: 'Across three time zones from day one' },
      { n: '0→1',  title: 'Built from scratch', desc: 'End-to-end: discovery to shipped product' },
    ],
    sections: [
      { h: 'Context', body: "Namecheap's support team was using a patchwork of tools — a legacy ticket system, an informal Slack workflow, and a spreadsheet for routing. Agents spent more time managing context than solving problems." },
      { h: 'What I designed', body: 'A unified support interface: chat, ticket history, and customer context in a single panel. Routing logic was surfaced as a visible queue, not a black box. Agents could see workload across the team in real-time.' },
    ],
    quote: 'It finally felt like a tool built for us — not a tool we were forced to use.',
  },
];
