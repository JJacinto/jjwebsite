// JJ Website — About, Cases, Contact Pages

function JJCasesPage({ setPage }) {
  const T = window.JJTokens;
  const cn = { maxWidth: T.container, margin: '0 auto', padding: `0 ${T.pad}` };

  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const cases = [
    { id: 'case-webinar', img: 'assets/images/case-webinar.avif', cat: 'Design', title: 'Redefining webinar customization' },
    { id: 'case-research', img: 'assets/images/case-research.avif', cat: 'Research Ops', title: 'Understanding webinar organizers' },
    { id: 'case-ds', img: 'assets/images/case-ds.avif', cat: 'Design Leadership', title: 'Leading and managing a design system' },
    { id: 'case-talkdesk', img: 'assets/images/case-talkdesk.avif', cat: 'Design', title: 'Reshaping an AI training platform' },
    { id: 'case-namecheap', img: 'assets/images/case-namecheap.avif', cat: 'Design', title: 'Designing a support chat experience' },
  ];

  return (
    <div style={{ background: T.bg, paddingTop: 'clamp(80px,12vw,130px)', paddingBottom: 'clamp(80px,10vw,120px)' }}>
      {/* Marquee */}
      <div style={{ overflow:'hidden', marginBottom:64, maskImage:'linear-gradient(to right,transparent,black 6%,black 94%,transparent)', WebkitMaskImage:'linear-gradient(to right,transparent,black 6%,black 94%,transparent)' }}>
        <div style={{ display:'flex', width:'max-content', animation:'marquee 22s linear infinite' }}>
          {['CASE STUDIES','·','CASE STUDIES','·','CASE STUDIES','·','CASE STUDIES','·'].map((w,i)=>(
            <span key={i} style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(4rem,9vw,7.5rem)', color:'rgba(28,26,23,0.05)', whiteSpace:'nowrap', letterSpacing:'-0.03em', padding:'0 24px' }}>{w}</span>
          ))}
        </div>
      </div>

      <div style={cn}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, marginBottom:24 }}>
          {cases.slice(0,3).map((c,i) => (
            <JJCaseCard key={c.id} c={c} T={T} setPage={setPage} delay={i} />
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:24 }}>
          {cases.slice(3).map((c,i) => (
            <JJCaseCard key={c.id} c={c} T={T} setPage={setPage} delay={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JJAboutPage({ setPage }) {
  const T = window.JJTokens;
  const cn = { maxWidth: T.container, margin: '0 auto', padding: `0 ${T.pad}` };

  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const tools = ['Figma', 'Framer', 'Notion', 'Jira', 'Linear', 'GitHub', 'Maze', 'Dovetail'];

  const h2 = { fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(1.8rem,3vw,2.4rem)', letterSpacing:'-0.03em', lineHeight:1.15, marginBottom:24, color:T.fg1 };
  const bodyP = { fontFamily:T.fontBody, fontSize:'0.95rem', color:T.fg2, lineHeight:1.85, marginBottom:14 };

  const career = [
    { year:'2024–now', role:'Senior Product Designer', co:'Anchorage Digital', desc:'Crypto/web3 infrastructure. Designing complex financial interfaces for institutional investors.' },
    { year:'2022–2024', role:'Senior Product Designer', co:'StreamYard', desc:'Live streaming platform. Led webinar UX, research ops, and the company-wide design system.' },
    { year:'2021–2022', role:'Senior Product Designer', co:'Hopin', desc:'Virtual events. Product design across attendee experience and networking features.' },
    { year:'2019–2021', role:'Senior Product Designer', co:'Talkdesk', desc:'AI/CX platform. Redesigned the AI trainer interface for non-technical users.' },
    { year:'2017–2019', role:'Product Designer', co:'Namecheap', desc:'Domain & hosting. Built the support chat platform from zero to 200+ agents.' },
    { year:'2015–2017', role:'UX/UI Designer', co:'Be.Ubi', desc:'First role. GIS and 3D visualisation tools for engineering teams.' },
  ];

  return (
    <div style={{ background:T.bg, paddingTop:'clamp(80px,12vw,130px)', paddingBottom:'clamp(80px,10vw,120px)' }}>

      {/* Marquee */}
      <div style={{ overflow:'hidden', marginBottom:72, maskImage:'linear-gradient(to right,transparent,black 6%,black 94%,transparent)', WebkitMaskImage:'linear-gradient(to right,transparent,black 6%,black 94%,transparent)' }}>
        <div style={{ display:'flex', width:'max-content', animation:'marquee 20s linear infinite' }}>
          {['ABOUT ME','·','SOBRE MIM','·','ABOUT ME','·','SOBRE MIM','·','ABOUT ME','·'].map((w,i)=>(
            <span key={i} style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(4rem,9vw,7.5rem)', color:'rgba(28,26,23,0.05)', whiteSpace:'nowrap', letterSpacing:'-0.03em', padding:'0 24px' }}>{w}</span>
          ))}
        </div>
      </div>

      <div style={cn}>
        {/* Why */}
        <section className="reveal" style={{ marginBottom:72, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(32px,6vw,80px)', alignItems:'start' }}>
          <div>
            <p style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.accent, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:16 }}>What is my 'why'?</p>
            <h2 style={{ ...h2, fontSize:'clamp(1.6rem,3vw,2.2rem)' }}>I design products that make things genuinely easier for the people who use them.</h2>
          </div>
          <div>
            <p style={bodyP}>I believe that every product designer should step into the shoes of their users, and learn from them day in and day out, to truly understand and meet their needs. By doing so, we can empower businesses to create products that genuinely resonate with their audience.</p>
            <p style={bodyP}>My enthusiasm is fueled by a strong connection to the product and its people, an in-depth immersion in its development, and a continuous learning journey from user feedback and interactions.</p>
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop:`1px solid ${T.border}`, marginBottom:72 }} />

        {/* About grid */}
        <section style={{ marginBottom:72 }}>
          <p className="reveal" style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:36 }}>About me</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40 }}>
            {[
              { title: "I'm...", items: ['An Enneagram type 5', 'An INTJ-A'] },
              { title: 'Values', items: ['Awareness', 'Creativity', 'Precision', 'Respect', 'Gratitude'] },
              { title: 'Passions', items: ['Product Design', 'Music production, Drums', 'VR', 'Gaming', 'Football'] },
            ].map((col, i) => (
              <div key={i} className={`reveal reveal-d${i+1}`}>
                <h3 style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'1.05rem', letterSpacing:'-0.02em', marginBottom:16, color:T.fg1 }}>{col.title}</h3>
                <ul style={{ listStyle:'none', padding:0 }}>
                  {col.items.map((item, j) => (
                    <li key={j} style={{ fontFamily:T.fontBody, fontSize:'0.9rem', color:T.fg2, padding:'6px 0', borderBottom:`1px solid ${T.border}` }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop:`1px solid ${T.border}`, marginBottom:72 }} />

        {/* Career */}
        <section style={{ marginBottom:72 }}>
          <p className="reveal" style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:36 }}>My journey</p>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {career.map((c, i) => (
              <div key={i} className="reveal"
                style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:32, padding:'24px 0', borderTop:`1px solid ${T.border}` }}>
                <div style={{ fontFamily:T.fontBody, fontSize:'0.8rem', color:T.fg3, paddingTop:3 }}>{c.year}</div>
                <div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:6 }}>
                    <span style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'0.95rem', letterSpacing:'-0.01em', color:T.fg1 }}>{c.role}</span>
                    <span style={{ fontFamily:T.fontBody, fontSize:'0.82rem', color:T.accent }}>@ {c.co}</span>
                  </div>
                  <p style={{ fontFamily:T.fontBody, fontSize:'0.875rem', color:T.fg2, lineHeight:1.7 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop:`1px solid ${T.border}`, marginBottom:72 }} />

        {/* Tools */}
        <section className="reveal">
          <p style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:28 }}>Tools I use</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {tools.map((tool, i) => (
              <span key={i} style={{ padding:'8px 18px', border:`1.5px solid ${T.border}`, borderRadius:T.radiusFull, fontFamily:T.fontBody, fontSize:'0.85rem', color:T.fg2, background:T.surface }}>
                {tool}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="reveal" style={{ marginTop:80, padding:52, background:T.dark, borderRadius:24, textAlign:'center' }}>
          <h2 style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(1.8rem,3vw,2.4rem)', letterSpacing:'-0.03em', color:T.fgInverse, marginBottom:16 }}>Want to work together?</h2>
          <p style={{ fontFamily:T.fontBody, fontSize:'0.95rem', color:'rgba(240,237,232,0.55)', marginBottom:32, maxWidth:400, margin:'0 auto 32px' }}>I'm always open to interesting projects and conversations.</p>
          <button
            style={{ padding:'13px 36px', borderRadius:T.radiusFull, fontSize:'0.9rem', fontFamily:T.fontBody, border:'none', background:T.accent, color:'#fff', cursor:'pointer', transition:'all 0.25s' }}
            onClick={() => setPage('contact')}
            onMouseEnter={e => { e.currentTarget.style.background=T.accentDark; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=T.accent; e.currentTarget.style.transform=''; }}>
            Let's chat
          </button>
        </div>
      </div>
    </div>
  );
}

function JJContactPage() {
  const T = window.JJTokens;
  const [copied, setCopied] = React.useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText('jjacinto.mail@gmail.com').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ background:T.dark, minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'80px 40px', textAlign:'center' }}>
      <div style={{ maxWidth:600, width:'100%' }}>
        <p style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:'rgba(240,237,232,0.35)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:24 }}>Contact</p>
        <h1 style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(2.4rem,5vw,3.8rem)', letterSpacing:'-0.04em', lineHeight:1.1, color:T.fgInverse, marginBottom:20 }}>
          Thanks for the visit.
        </h1>
        <p style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(1.8rem,3.5vw,2.8rem)', letterSpacing:'-0.03em', lineHeight:1.1, color:'rgba(240,237,232,0.35)', marginBottom:52 }}>
          Let's chat.
        </p>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:64 }}>
          <a href="mailto:jjacinto.mail@gmail.com"
            style={{ padding:'14px 36px', borderRadius:T.radiusFull, background:T.accent, color:'#fff', fontFamily:T.fontBody, fontSize:'0.9rem', textDecoration:'none', transition:'all 0.25s', display:'inline-block' }}
            onMouseEnter={e => { e.currentTarget.style.background=T.accentDark; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=T.accent; e.currentTarget.style.transform=''; }}>
            Contact me
          </a>
          <a href="https://linkedin.com/in/joaofranciscojacinto/" target="_blank" rel="noopener noreferrer"
            style={{ padding:'14px 36px', borderRadius:T.radiusFull, border:'1.5px solid rgba(240,237,232,0.2)', color:T.fgInverse, fontFamily:T.fontBody, fontSize:'0.9rem', textDecoration:'none', transition:'all 0.25s', display:'inline-block' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(240,237,232,0.5)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(240,237,232,0.2)'; e.currentTarget.style.transform=''; }}>
            LinkedIn
          </a>
        </div>

        <div style={{ borderTop:'1px solid rgba(240,237,232,0.08)', paddingTop:40, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
          {[
            { label:'Email', value:'jjacinto.mail@gmail.com', action: copyEmail, hint: copied ? 'Copied!' : 'Click to copy' },
            { label:'LinkedIn', value:'joaofranciscojacinto', link:'https://linkedin.com/in/joaofranciscojacinto/', hint:'Open profile' },
            { label:'Location', value:'Aveiro, Portugal', hint:'UTC+0/+1' },
          ].map((item,i) => (
            <div key={i}
              style={{ cursor: item.action || item.link ? 'pointer' : 'default', padding:16, borderRadius:12, transition:'background 0.2s' }}
              onClick={item.action || (item.link ? () => window.open(item.link,'_blank') : undefined)}
              onMouseEnter={e => { if (item.action || item.link) e.currentTarget.style.background='rgba(240,237,232,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>
              <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:'rgba(240,237,232,0.35)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{item.label}</div>
              <div style={{ fontFamily:T.fontBody, fontSize:'0.875rem', color:T.fgInverse, marginBottom:4 }}>{item.value}</div>
              {item.hint && <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:T.accent }}>{item.hint}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { JJCasesPage, JJAboutPage, JJContactPage });
