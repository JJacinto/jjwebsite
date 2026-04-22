// JJ Design System — Home Page
// Exports: JJHomePage

function JJHomePage({ setPage }) {
  const T = window.JJTokens;

  const heroStyle = {
    paddingTop: 'clamp(110px,14vw,150px)', paddingBottom: 60,
    textAlign: 'center', position: 'relative', overflow: 'hidden',
    background: T.bg,
  };

  const subtitles = ['Product Designer', 'Problem Solver', 'Design Systems Thinker', 'Frontend-Fluent'];
  const [subIdx, setSubIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setSubIdx(i => (i + 1) % subtitles.length), 2200);
    return () => clearInterval(t);
  }, []);

  const displayStyle = {
    fontFamily: T.fontDisplay, fontWeight: 900,
    fontSize: 'clamp(2.8rem,5vw,4rem)',
    letterSpacing: '-0.035em', lineHeight: 1.1,
    color: T.fg1, marginBottom: 6,
  };

  const photoStyle = {
    width: 'clamp(200px,28vw,280px)', height: 'clamp(200px,28vw,280px)',
    borderRadius: '50%', overflow: 'hidden', margin: '0 auto 36px',
    boxShadow: `0 0 60px rgba(61,61,181,0.2)`,
    position: 'relative', zIndex: 2,
  };

  const sectionStyle = {
    padding: `${T.sectionGap} 0`, background: T.bg,
  };

  const containerStyle = {
    maxWidth: T.container, margin: '0 auto', padding: `0 ${T.pad}`,
  };

  const eyebrow = {
    fontFamily: T.fontBody, fontSize: '0.8rem',
    letterSpacing: '0.05em', textTransform: 'uppercase',
    color: T.fg3, textAlign: 'center', marginBottom: 48,
  };

  const statsGrid = {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40,
  };

  const statNum = {
    fontFamily: T.fontDisplay, fontWeight: 900,
    fontSize: 'clamp(2.8rem,5vw,4rem)',
    letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4, color: T.fg1,
  };

  const testimonialsGrid = { columns: 2, columnGap: 24 };

  const cases = [
    { id: 'case-webinar', img: '../../assets/images/case-webinar.avif', cat: 'Design', title: 'Redefining webinar customization' },
    { id: 'case-research', img: '../../assets/images/case-research.avif', cat: 'Research Ops', title: 'Understanding webinar organizers' },
    { id: 'case-ds', img: '../../assets/images/case-ds.avif', cat: 'Design Leadership', title: 'Leading and managing a design system' },
  ];

  const testimonials = [
    { name: 'Daniel Cardoso', role: 'Director of Design for AI at Talkdesk', quote: 'João possesses a unique combination of technical proficiency, design expertise, and exceptional UX competencies, making him a valuable asset to any team.' },
    { name: 'Renato Duarte', role: 'Engineering Manager at Uniplaces', quote: 'João has the mind of a perfectionist mixed with the right amount of creativity. Each UI component he drew was always well thought out, to the point that every detail had context and meaning.' },
    { name: 'Bartlomiej Mucha', role: 'Staff Engineer at StreamYard', quote: 'I always appreciate his extensive knowledge, and good research between different ideas and reasoning. We often have a very aligned way of thinking about user experience.' },
    { name: 'Will Brett-Atkin', role: 'Staff Product Designer at StreamYard', quote: 'João possesses a rare talent for efficiently managing multiple high-priority, high-impact projects simultaneously.' },
  ];

  const btnStyle = {
    padding: '13px 32px', borderRadius: T.radiusFull, fontSize: '0.9rem',
    fontFamily: T.fontBody, border: `1.5px solid ${T.border}`,
    background: 'rgba(255,255,255,0.5)', cursor: 'pointer',
    color: T.fg1, transition: 'all 0.25s', display: 'inline-flex',
  };

  return (
    <div>
      {/* HERO */}
      <section style={heroStyle}>
        {/* Marquee bg */}
        <div style={{ position:'absolute', top:'50%', left:0, right:0, transform:'translateY(-50%)', overflow:'hidden', pointerEvents:'none', zIndex:1 }}>
          <div style={{ display:'flex', width:'max-content', animation:'marquee 28s linear infinite' }}>
            {['WELCOME','●','BEM-VINDO','WELCOME','●','BEM-VINDO','WELCOME','●','BEM-VINDO'].map((w,i)=>(
              <span key={i} style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(5rem,12vw,9rem)', color:'rgba(61,61,181,0.07)', whiteSpace:'nowrap', letterSpacing:'-0.03em', padding:'0 32px' }}>{w}</span>
            ))}
          </div>
        </div>
        <div style={{ position:'relative', zIndex:2 }}>
          <h1 style={displayStyle}>Hi 👋 I'm João Jacinto.</h1>
          <p style={{ fontFamily:T.fontBody, fontSize:'clamp(1rem,2vw,1.2rem)', color:T.fg3, marginBottom:36, minHeight:'1.6em' }}>{subtitles[subIdx]}</p>
          <div style={photoStyle}>
            <img src="../../assets/images/joao-photo.webp" alt="João Jacinto"
              style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}
              onError={e => { e.target.style.display='none'; }}
            />
          </div>
          <p style={{ fontFamily:T.fontBody, fontSize:'1rem', color:T.fg2, maxWidth:540, margin:'0 auto 28px', lineHeight:1.75 }}>
            Designing digital products with startups and enterprises since 2015, with love ♥
          </p>
          <button style={btnStyle} onClick={() => setPage('about')}>Learn more</button>
        </div>
      </section>

      {/* STATS */}
      <section style={sectionStyle}>
        <div style={containerStyle}>
          <p style={eyebrow}>My career in numbers so far:</p>
          <div style={statsGrid}>
            {[
              { n: '10', sup: '+', title: 'Years of experience', desc: 'Working with innovative startups and global enterprises' },
              { n: '5', unit: '.0M', sup: '+', title: 'Users impacted', desc: "Products collectively reaching over 5M users" },
              { n: '8', title: 'Industries', desc: 'AI, streaming, e-commerce, GIS, crypto, and more' },
              { n: '5', title: 'Products launched', desc: 'StreamYard On-Air, Talkdesk AI trainer, and more' },
            ].map((s, i) => (
              <div key={i}>
                <div style={statNum}>
                  {s.n}
                  {s.unit && <span style={{ fontSize:'0.45em', color:T.fg3 }}>{s.unit}</span>}
                  {s.sup && <sup style={{ fontSize:'0.4em', color:T.fg3, verticalAlign:'super' }}>{s.sup}</sup>}
                </div>
                <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'0.95rem', letterSpacing:'-0.01em', marginBottom:6 }}>{s.title}</div>
                <p style={{ fontFamily:T.fontBody, fontSize:'0.82rem', color:T.fg3, lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:48 }}>
            <button style={btnStyle} onClick={() => setPage('contact')}>Let's connect</button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ ...sectionStyle, paddingTop:0 }}>
        <div style={containerStyle}>
          <p style={eyebrow}>What people are saying:</p>
          <div style={testimonialsGrid}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ breakInside:'avoid', background:T.surface, borderRadius:T.radiusMd, padding:24, marginBottom:20, boxShadow:T.shadowSm }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#D5CDC9,#B8A8A3)', flexShrink:0 }} />
                  <div>
                    <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'0.88rem', letterSpacing:'-0.01em' }}>{t.name}</div>
                    <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:T.fg3, marginTop:1 }}>{t.role}</div>
                  </div>
                </div>
                <p style={{ fontFamily:T.fontBody, fontSize:'0.84rem', color:T.fg2, lineHeight:1.7 }}>{t.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASE PREVIEWS */}
      <section style={{ ...sectionStyle, paddingTop:0 }}>
        <div style={containerStyle}>
          <p style={eyebrow}>You may like to read:</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {cases.map(c => (
              <div key={c.id} onClick={() => setPage(c.id)}
                style={{ background:T.surface, borderRadius:T.radiusMd, overflow:'hidden', boxShadow:T.shadowSm, cursor:'pointer', transition:'transform 0.25s,box-shadow 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=T.shadowLg; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=T.shadowSm; }}>
                <img src={c.img} alt={c.title} style={{ width:'100%', height:150, objectFit:'cover', display:'block' }} />
                <div style={{ padding:18 }}>
                  <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:T.fg3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{c.cat}</div>
                  <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'0.92rem', letterSpacing:'-0.02em', lineHeight:1.3 }}>{c.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { JJHomePage });
