// JJ Website — Case Study Detail

const CASES = {
  'case-webinar': {
    cat: 'Design · StreamYard',
    title: 'Redefining webinar customization',
    subtitle: 'How I redesigned the end-to-end customization experience for StreamYard\'s webinar product, serving 5M+ live streaming users.',
    img: 'assets/images/case-webinar.avif',
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
      { n: '0', title: 'Regression bugs', desc: 'At launch — engineering-design co-design worked' },
    ],
    sections: [
      { h: 'The problem', body: 'Webinar organizers were navigating three separate panels to customize a single broadcast. The mental model was fragmented and error-prone — users frequently published with the wrong branding or missing assets.' },
      { h: 'My approach', body: 'I ran moderated usability sessions with 12 organizers across segments (solopreneurs, enterprise teams, educators). The insight was consistent: customization felt like configuration, not creation. We needed to shift the frame.' },
      { h: 'The solution', body: 'A unified "Brand Studio" — a persistent side panel that gave organizers a live preview alongside their edits. All assets, colors, and layouts in one place. Changes reflected in real-time across the broadcast canvas.' },
    ],
    quote: 'The new editor made our webinar setup feel like building something, not filling out a form.',
  },
  'case-research': {
    cat: 'Research Ops · StreamYard',
    title: 'Understanding webinar organizers',
    subtitle: 'A research operations effort to build a continuous feedback loop with StreamYard\'s webinar segment — informing 12 months of product decisions.',
    img: 'assets/images/case-research.avif',
    year: '2022', role: 'Senior Product Designer', company: 'StreamYard', duration: '3 months (ongoing)',
    keywords: ['Research Ops', 'Moderated Testing', 'Surveys', 'Segmentation', 'Insight Repository'],
    achievements: [
      'Established a recurring user panel of 40+ webinar organizers',
      'Delivered 6 research reports consumed by product, design, and marketing',
      'Reduced time from question to insight from 3 weeks to 5 days',
    ],
    outcomes: [
      { n: '40+', title: 'Panel members', desc: 'Recurring participants across organizer segments' },
      { n: '6', title: 'Reports delivered', desc: 'Consumed by product, design, and marketing' },
      { n: '5 days', title: 'Insight cycle', desc: 'Down from 3 weeks — faster decisions' },
    ],
    sections: [
      { h: 'The problem', body: 'Product decisions about the webinar segment were being made without direct user input. The team relied on NPS data and support tickets — lagging signals that told us what went wrong, not why.' },
      { h: 'What I built', body: 'A lightweight research ops system: a screened user panel, a reusable interview guide template, a shared Notion insight repository, and a monthly synthesis ritual that all PMs attended.' },
    ],
    quote: 'For the first time, we had a direct line to the people using our product — not just the data they left behind.',
  },
  'case-ds': {
    cat: 'Design Leadership · StreamYard',
    title: 'Leading and managing a design system',
    subtitle: 'How I built, scaled, and maintained a component library that became the single source of truth for StreamYard\'s design and engineering teams.',
    img: 'assets/images/case-ds.avif',
    year: '2022–2023', role: 'Senior Product Designer', company: 'StreamYard', duration: '18 months',
    keywords: ['Design System', 'Component Library', 'Figma', 'Accessibility', 'Tokens', 'Engineering Collaboration'],
    achievements: [
      'Grew library from 40 to 200+ components with full Figma + code parity',
      'Reduced design-to-development handoff friction by an estimated 35%',
      'Onboarded 4 new designers to the system with zero dedicated docs sessions',
    ],
    outcomes: [
      { n: '200+', title: 'Components', desc: 'Full Figma + code parity at ship' },
      { n: '35%', title: 'Less friction', desc: 'Estimated reduction in handoff time' },
      { n: '4', title: 'Designers onboarded', desc: 'Self-serve — no dedicated docs sessions' },
    ],
    sections: [
      { h: 'The challenge', body: 'StreamYard had grown fast. Design patterns had diverged across features, and engineers were implementing the same component six different ways. The design system existed in name only — a Figma file nobody fully trusted.' },
      { h: 'What I did', body: 'I audited the product, identified the 20 highest-leverage components, and rebuilt them from scratch with proper variants, states, and documentation. Then I worked directly with the lead engineer to establish a token system that bridged Figma and the codebase.' },
    ],
    quote: 'The design system became the single source of truth — reducing design debt and letting the team move faster with confidence.',
  },
  'case-talkdesk': {
    cat: 'Design · Talkdesk',
    title: 'Reshaping an AI training platform',
    subtitle: 'Redesigning the trainer interface for Talkdesk\'s AI/CX platform — making it usable for non-technical users without losing power-user depth.',
    img: 'assets/images/case-talkdesk.avif',
    year: '2021', role: 'Senior Product Designer', company: 'Talkdesk', duration: '9 months',
    keywords: ['AI/ML UX', 'Enterprise SaaS', 'Information Architecture', 'Complex Workflows', 'B2B'],
    achievements: [
      'Reduced average training session setup time from 45 to 18 minutes',
      'Designed for two distinct user personas without a bifurcated interface',
      'Shipped as part of Talkdesk AI Trainer GA release',
    ],
    outcomes: [
      { n: '18 min', title: 'Setup time', desc: 'Down from 45 min average for new trainers' },
      { n: '2', title: 'Personas served', desc: 'One interface, two experience levels' },
      { n: 'GA', title: 'Shipped', desc: 'Part of Talkdesk AI Trainer general availability' },
    ],
    sections: [
      { h: 'The problem', body: 'The AI trainer was built for ML engineers. But the actual users were CX managers — people with deep domain expertise and zero machine learning background. The interface assumed knowledge it had no right to assume.' },
      { h: 'The approach', body: 'I mapped the mental model gap between expert and novice users. The redesign surfaced progressive disclosure — experts could go deep, beginners got guardrails. Labels were rewritten from technical jargon to task language.' },
    ],
    quote: 'For the first time, I could actually do this myself. I didn\'t need to file a ticket.',
  },
  'case-namecheap': {
    cat: 'Design · Namecheap',
    title: 'Designing a support chat experience',
    subtitle: 'Building a customer support platform from the ground up for Namecheap\'s engineering team — reducing ticket volume and improving resolution speed.',
    img: 'assets/images/case-namecheap.avif',
    year: '2019–2020', role: 'Product Designer', company: 'Namecheap', duration: '12 months',
    keywords: ['Customer Support', 'Internal Tools', 'Chat UX', 'Engineering Platform', 'B2B2C'],
    achievements: [
      'Designed end-to-end from discovery to shipped product',
      'Reduced average resolution time by 22% in the first quarter post-launch',
      'Adopted by 200+ support agents across three time zones',
    ],
    outcomes: [
      { n: '22%', title: 'Faster resolution', desc: 'Average ticket resolution time in Q1 post-launch' },
      { n: '200+', title: 'Agents', desc: 'Across three time zones from day one' },
      { n: '0→1', title: 'Built from scratch', desc: 'End-to-end: discovery to shipped product' },
    ],
    sections: [
      { h: 'Context', body: 'Namecheap\'s support team was using a patchwork of tools — a legacy ticket system, an informal Slack workflow, and a spreadsheet for routing. Agents spent more time managing context than solving problems.' },
      { h: 'What I designed', body: 'A unified support interface: chat, ticket history, and customer context in a single panel. The routing logic was surfaced as a visible queue, not a black box. Agents could see workload across the team in real-time.' },
    ],
    quote: 'It finally felt like a tool built for us — not a tool we were forced to use.',
  },
};

function JJCaseDetail({ caseId, setPage }) {
  const T = window.JJTokens;
  const c = CASES[caseId];
  if (!c) return null;

  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [caseId]);

  const cn = { maxWidth: T.container, margin: '0 auto', padding: `0 ${T.pad}` };
  const bodyP = { fontFamily:T.fontBody, fontSize:'0.95rem', color:T.fg2, lineHeight:1.85, marginBottom:16 };

  // Next case
  const allIds = Object.keys(CASES);
  const curIdx = allIds.indexOf(caseId);
  const nextId = allIds[(curIdx + 1) % allIds.length];
  const nextCase = CASES[nextId];

  return (
    <div style={{ background:T.bg, paddingTop:'clamp(80px,12vw,120px)', paddingBottom:'clamp(80px,10vw,120px)' }}>
      <div style={cn}>

        {/* Back */}
        <button onClick={() => setPage('cases')}
          style={{ display:'inline-flex', alignItems:'center', gap:8, fontFamily:T.fontBody, fontSize:'0.875rem', color:T.fg3, cursor:'pointer', marginBottom:48, background:'none', border:'none', padding:0, transition:'color 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.color=T.fg1}
          onMouseLeave={e=>e.currentTarget.style.color=T.fg3}>
          ← Back to case studies
        </button>

        {/* Header */}
        <div style={{ paddingBottom:48, borderBottom:`1px solid ${T.border}`, marginBottom:52 }}>
          <p style={{ fontFamily:T.fontBody, fontSize:'0.75rem', color:T.accent, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:16 }}>{c.cat}</p>
          <h1 style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(2rem,4.5vw,3.2rem)', letterSpacing:'-0.038em', lineHeight:1.12, marginBottom:20, color:T.fg1, maxWidth:720 }}>{c.title}</h1>
          <p style={{ ...bodyP, fontSize:'1.05rem', maxWidth:660, marginBottom:36 }}>{c.subtitle}</p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, marginBottom:32 }}>
            {[['Company',c.company],['Role',c.role],['Year',c.year],['Duration',c.duration]].map(([label,val],i)=>(
              <div key={i}>
                <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:T.fg3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
                <div style={{ fontFamily:T.fontBody, fontSize:'0.9rem', color:T.fg1 }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {c.keywords.map((k,i)=>(
              <span key={i} style={{ padding:'6px 16px', border:`1.5px solid ${T.border}`, borderRadius:T.radiusFull, fontFamily:T.fontBody, fontSize:'0.8rem', color:T.fg2, background:T.surface }}>
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Hero image */}
        <div className="reveal" style={{ marginBottom:60, borderRadius:20, overflow:'hidden', border:`1px solid ${T.border}` }}>
          <img src={c.img} alt={c.title} style={{ width:'100%', maxHeight:460, objectFit:'cover', display:'block' }} />
        </div>

        {/* Outcomes banner */}
        <div className="reveal" style={{ background:T.accentSubtle, borderRadius:16, padding:'32px 40px', marginBottom:64, display:'grid', gridTemplateColumns:`repeat(${c.outcomes.length},1fr)`, gap:24 }}>
          {c.outcomes.map((o,i)=>(
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(1.8rem,3.5vw,2.8rem)', color:T.accent, letterSpacing:'-0.04em', marginBottom:6 }}>{o.n}</div>
              <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'0.88rem', letterSpacing:'-0.01em', marginBottom:4, color:T.fg1 }}>{o.title}</div>
              <div style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, lineHeight:1.5 }}>{o.desc}</div>
            </div>
          ))}
        </div>

        {/* Key achievements */}
        <div className="reveal" style={{ marginBottom:64 }}>
          <p style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:20 }}>Key outcomes</p>
          <ul style={{ listStyle:'none', padding:0 }}>
            {c.achievements.map((a,i)=>(
              <li key={i} style={{ fontFamily:T.fontBody, fontSize:'0.95rem', color:T.fg2, lineHeight:1.8, paddingLeft:24, position:'relative', marginBottom:8 }}>
                <span style={{ position:'absolute', left:0, color:T.accent }}>→</span>{a}
              </li>
            ))}
          </ul>
        </div>

        {/* Sections */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'40px 64px', marginBottom:64 }}>
          {c.sections.map((s,i)=>(
            <div key={i} className="reveal">
              <h2 style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(1.3rem,2.5vw,1.7rem)', letterSpacing:'-0.03em', marginBottom:16, color:T.fg1 }}>{s.h}</h2>
              <p style={bodyP}>{s.body}</p>
            </div>
          ))}
        </div>

        {/* Pull quote */}
        <blockquote className="reveal" style={{ borderLeft:`3px solid ${T.accent}`, paddingLeft:32, margin:'0 0 72px', fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(1.1rem,2vw,1.5rem)', letterSpacing:'-0.025em', fontStyle:'normal', color:T.fg1, lineHeight:1.5 }}>
          "{c.quote}"
        </blockquote>

        {/* Next case */}
        <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:48 }}>
          <p style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:20 }}>Next case study</p>
          <div className="reveal"
            style={{ background:T.surface, borderRadius:T.radiusMd, overflow:'hidden', cursor:'pointer', transition:'all 0.28s cubic-bezier(0.22,1,0.36,1)', display:'grid', gridTemplateColumns:'1fr 2fr', alignItems:'center' }}
            onClick={() => setPage(nextId)}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=T.shadowLg; }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
            <img src={nextCase.img} alt={nextCase.title} style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} />
            <div style={{ padding:28 }}>
              <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:T.fg3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{nextCase.cat}</div>
              <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'1.15rem', letterSpacing:'-0.025em', lineHeight:1.3, color:T.fg1 }}>{nextCase.title} →</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { JJCaseDetail });
