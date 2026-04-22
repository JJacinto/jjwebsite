// JJ Website — Home Page
function JJHomePage({ setPage }) {
  const T = window.JJTokens;

  // Scroll reveal
  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const companies = [
    { name: 'anchorage-digital', label: 'Anchorage Digital', url: 'https://cdn.simpleicons.org/anchorage' },
    { name: 'streamyard', label: 'StreamYard', url: null },
    { name: 'hopin', label: 'Hopin', url: null },
    { name: 'talkdesk', label: 'Talkdesk', url: 'https://cdn.simpleicons.org/talkdesk' },
    { name: 'namecheap', label: 'Namecheap', url: 'https://cdn.simpleicons.org/namecheap' },
  ];

  const cases = [
    { id: 'case-webinar', img: 'assets/images/case-webinar.avif', cat: 'Design', title: 'Redefining webinar customization' },
    { id: 'case-research', img: 'assets/images/case-research.avif', cat: 'Research Ops', title: 'Understanding webinar organizers' },
    { id: 'case-ds', img: 'assets/images/case-ds.avif', cat: 'Design Leadership', title: 'Leading and managing a design system' },
  ];

  const testimonials = [
    { name: 'Daniel Cardoso', role: 'Director of Design for AI, Talkdesk', quote: 'João possesses a unique combination of technical proficiency, design expertise, and exceptional UX competencies, making him a valuable asset to any team.' },
    { name: 'Renato Duarte', role: 'Engineering Manager, Uniplaces', quote: 'João has the mind of a perfectionist mixed with the right amount of creativity. Each UI component he drew was always well thought out, to the point that every detail had context and meaning.' },
    { name: 'Bartlomiej Mucha', role: 'Staff Engineer, StreamYard', quote: 'I always appreciate his extensive knowledge, and good research between different ideas and reasoning. We often have a very aligned way of thinking about user experience.' },
    { name: 'Will Brett-Atkin', role: 'Staff Product Designer, StreamYard', quote: 'João possesses a rare talent for efficiently managing multiple high-priority, high-impact projects simultaneously.' },
  ];

  const cn = { maxWidth: T.container, margin: '0 auto', padding: `0 ${T.pad}` };

  const stats = [
    { n: '10+', title: 'Years of experience', desc: 'Working with startups and global enterprises' },
    { n: '5M+', title: 'Users impacted', desc: 'Products collectively reaching over 5M users' },
    { n: '8', title: 'Industries', desc: 'AI, streaming, crypto, e-commerce and more' },
    { n: '5', title: 'Products launched', desc: 'StreamYard On-Air, Talkdesk AI trainer, and more' },
  ];

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{ paddingTop: 'clamp(120px,16vw,160px)', paddingBottom: 80, textAlign: 'center', background: T.bg, position: 'relative', overflow: 'hidden' }}>
        {/* Marquee bg text */}
        <div style={{ position:'absolute', top:'50%', left:0, right:0, transform:'translateY(-60%)', overflow:'hidden', pointerEvents:'none', zIndex:1, maskImage:'linear-gradient(to right,transparent,black 10%,black 90%,transparent)', WebkitMaskImage:'linear-gradient(to right,transparent,black 10%,black 90%,transparent)' }}>
          <div style={{ display:'flex', width:'max-content', animation:'marquee 30s linear infinite' }}>
            {['WELCOME','·','BEM-VINDO','·','WELCOME','·','BEM-VINDO','·','WELCOME','·','BEM-VINDO','·'].map((w,i)=>(
              <span key={i} style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(6rem,14vw,11rem)', color:'rgba(61,61,181,0.055)', whiteSpace:'nowrap', letterSpacing:'-0.03em', padding:'0 24px' }}>{w}</span>
            ))}
          </div>
        </div>

        <div style={{ position:'relative', zIndex:2 }}>
          <h1 style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(2.6rem,5vw,3.8rem)', letterSpacing:'-0.035em', lineHeight:1.1, color:T.fg1, marginBottom:8 }}>
            Hi 👋 I'm João Jacinto.
          </h1>
          <p style={{ fontFamily:T.fontBody, fontSize:'clamp(1rem,2vw,1.15rem)', color:T.fg3, marginBottom:44, letterSpacing:'0.01em' }}>
            Senior Product Designer
          </p>

          {/* Photo */}
          <div style={{ width:'clamp(200px,26vw,268px)', height:'clamp(200px,26vw,268px)', borderRadius:'50%', overflow:'hidden', margin:'0 auto 44px', boxShadow:`0 0 0 1px ${T.border}, 0 20px 60px rgba(61,61,181,0.15)`, position:'relative' }}>
            <img src="assets/images/joao-photo.webp" alt="João Jacinto" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>

          <p style={{ fontFamily:T.fontBody, fontSize:'1rem', color:T.fg2, maxWidth:500, margin:'0 auto 36px', lineHeight:1.8 }}>
            Designing digital products with startups and enterprises since 2015, with love ♥
          </p>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button
              style={{ padding:'13px 32px', borderRadius:T.radiusFull, fontSize:'0.9rem', fontFamily:T.fontBody, border:'none', background:T.fg1, color:T.fgInverse, cursor:'pointer', transition:'all 0.25s' }}
              onClick={() => setPage('about')}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform=''}>
              Learn more
            </button>
            <button
              style={{ padding:'13px 32px', borderRadius:T.radiusFull, fontSize:'0.9rem', fontFamily:T.fontBody, border:`1.5px solid ${T.borderStrong}`, background:'rgba(255,255,255,0.5)', color:T.fg1, cursor:'pointer', transition:'all 0.25s' }}
              onClick={() => setPage('cases')}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.fg1; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.transform=''; }}>
              View work
            </button>
          </div>
        </div>
      </section>

      {/* ── WORKED WITH ──────────────────────────────── */}
      <section style={{ padding:'60px 0', borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, background:T.bg, overflow:'hidden' }}>
        <div style={cn}>
          <p style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, textAlign:'center', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:36 }}>I've proudly worked with</p>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'clamp(24px,5vw,60px)', flexWrap:'wrap' }}>
            {['Anchorage Digital','StreamYard','Hopin','Talkdesk','Namecheap','Be.Ubi'].map((name,i) => (
              <span key={i} style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(0.9rem,2vw,1.15rem)', color:T.fg3, letterSpacing:'-0.02em', opacity:0.6, transition:'opacity 0.2s', cursor:'default' }}
                onMouseEnter={e=>e.currentTarget.style.opacity=1}
                onMouseLeave={e=>e.currentTarget.style.opacity=0.6}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────── */}
      <section style={{ padding:`clamp(72px,10vw,100px) 0`, background:T.bg }}>
        <div style={cn}>
          <p className="reveal" style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, textAlign:'center', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:52 }}>My career in numbers</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'clamp(24px,4vw,48px)' }}>
            {stats.map((s,i) => (
              <div key={i} className={`reveal reveal-d${i+1}`} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(3rem,5vw,4.5rem)', letterSpacing:'-0.04em', lineHeight:1, color:T.fg1, marginBottom:8 }}>{s.n}</div>
                <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'0.92rem', letterSpacing:'-0.01em', marginBottom:6, color:T.fg1 }}>{s.title}</div>
                <p style={{ fontFamily:T.fontBody, fontSize:'0.82rem', color:T.fg3, lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:52 }}>
            <button className="reveal"
              style={{ padding:'13px 32px', borderRadius:T.radiusFull, fontSize:'0.9rem', fontFamily:T.fontBody, border:`1.5px solid ${T.borderStrong}`, background:'rgba(255,255,255,0.5)', color:T.fg1, cursor:'pointer', transition:'all 0.25s' }}
              onClick={() => setPage('contact')}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.fg1; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.transform=''; }}>
              Let's connect
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────── */}
      <section style={{ padding:`clamp(60px,8vw,80px) 0`, background:T.bgAlt }}>
        <div style={cn}>
          <p className="reveal" style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:40, textAlign:'center' }}>What people are saying</p>
          <div style={{ columns:2, columnGap:24 }}>
            {testimonials.map((t,i) => (
              <div key={i} className={`reveal reveal-d${(i%2)+1}`} style={{ breakInside:'avoid', background:T.surface, borderRadius:T.radiusMd, padding:28, marginBottom:20, boxShadow:T.shadowSm }}>
                <p style={{ fontFamily:T.fontBody, fontSize:'0.875rem', color:T.fg2, lineHeight:1.75, marginBottom:20, fontStyle:'italic' }}>"{t.quote}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${T.accentSubtle},rgba(61,61,181,0.2))`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontDisplay, fontWeight:900, fontSize:'0.75rem', color:T.accent }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'0.85rem', letterSpacing:'-0.01em', color:T.fg1 }}>{t.name}</div>
                    <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:T.fg3, marginTop:2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASE PREVIEWS ────────────────────────── */}
      <section style={{ padding:`clamp(72px,10vw,100px) 0`, background:T.bg }}>
        <div style={cn}>
          <p className="reveal" style={{ fontFamily:T.fontBody, fontSize:'0.78rem', color:T.fg3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:40, textAlign:'center' }}>You may like to read:</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {cases.map((c,i) => (
              <JJCaseCard key={c.id} c={c} T={T} setPage={setPage} delay={i} />
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:48 }}>
            <button className="reveal"
              style={{ padding:'13px 32px', borderRadius:T.radiusFull, fontSize:'0.9rem', fontFamily:T.fontBody, border:`1.5px solid ${T.borderStrong}`, background:'rgba(255,255,255,0.5)', color:T.fg1, cursor:'pointer', transition:'all 0.25s' }}
              onClick={() => setPage('cases')}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.fg1; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.transform=''; }}>
              All case studies →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function JJCaseCard({ c, T, setPage, delay = 0 }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div className={`reveal reveal-d${delay+1}`}
      onClick={() => setPage(c.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background:T.surface, borderRadius:T.radiusMd, overflow:'hidden',
        boxShadow: hovered ? T.shadowLg : T.shadowSm,
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition:'all 0.28s cubic-bezier(0.22,1,0.36,1)', cursor:'pointer' }}>
      <div style={{ overflow:'hidden', height:180 }}>
        <img src={c.img} alt={c.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.4s cubic-bezier(0.22,1,0.36,1)', transform: hovered ? 'scale(1.04)' : 'scale(1)' }} />
      </div>
      <div style={{ padding:'20px 22px 24px' }}>
        <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:T.fg3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{c.cat}</div>
        <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'1rem', letterSpacing:'-0.02em', lineHeight:1.3, color:T.fg1 }}>{c.title}</div>
      </div>
    </div>
  );
}

Object.assign(window, { JJHomePage, JJCaseCard });
