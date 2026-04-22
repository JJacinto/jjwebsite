// JJ Design System — Cases + About + Contact Pages
// Exports: JJCasesPage, JJAboutPage, JJContactPage

function JJCasesPage({ setPage }) {
  const T = window.JJTokens;
  const containerStyle = { maxWidth: T.container, margin: '0 auto', padding: `0 ${T.pad}` };

  const cases = [
    { id: 'case-webinar', img: '../../assets/images/case-webinar.avif', cat: 'Design', title: 'Redefining webinar customization' },
    { id: 'case-research', img: '../../assets/images/case-research.avif', cat: 'Research Ops', title: 'Understanding webinar organizers' },
    { id: 'case-ds', img: '../../assets/images/case-ds.avif', cat: 'Design Leadership', title: 'Leading and managing a design system' },
    { id: 'case-talkdesk', img: '../../assets/images/case-talkdesk.avif', cat: 'Design', title: 'Reshaping an AI training platform' },
    { id: 'case-namecheap', img: '../../assets/images/case-namecheap.avif', cat: 'Design', title: 'Designing a support chat experience' },
  ];

  const cardHover = { transform:'translateY(-3px)', boxShadow:'0 8px 30px rgba(0,0,0,0.07)' };

  return (
    <div style={{ background: T.bg, paddingTop: 'clamp(80px,12vw,130px)', paddingBottom: T.sectionGap }}>
      {/* Marquee */}
      <div style={{ overflow:'hidden', marginBottom:60, maskImage:'linear-gradient(to right,transparent,black 8%,black 92%,transparent)' }}>
        <div style={{ display:'flex', width:'max-content', animation:'marquee 22s linear infinite' }}>
          {['CASE STUDIES','●','CASE STUDIES','●','CASE STUDIES','●'].map((w,i)=>(
            <span key={i} style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(4rem,9vw,7rem)', color:'rgba(28,26,23,0.05)', whiteSpace:'nowrap', letterSpacing:'-0.03em', padding:'0 28px' }}>{w}</span>
          ))}
        </div>
      </div>

      <div style={containerStyle}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, marginBottom:24 }}>
          {cases.slice(0,3).map(c => (
            <CaseCard key={c.id} c={c} T={T} setPage={setPage} />
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:24 }}>
          {cases.slice(3).map(c => (
            <CaseCard key={c.id} c={c} T={T} setPage={setPage} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CaseCard({ c, T, setPage }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div onClick={() => setPage(c.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background:T.surface, borderRadius:T.radiusMd, overflow:'hidden',
        boxShadow: hovered ? T.shadowLg : T.shadowSm,
        transform: hovered ? 'translateY(-3px)' : 'none',
        transition:'all 0.25s', cursor:'pointer' }}>
      <img src={c.img} alt={c.title} style={{ width:'100%', height:190, objectFit:'cover', display:'block' }} />
      <div style={{ padding:22 }}>
        <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:T.fg3, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{c.cat}</div>
        <div style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'1rem', letterSpacing:'-0.02em', lineHeight:1.3, color:T.fg1 }}>{c.title}</div>
      </div>
    </div>
  );
}

function JJAboutPage({ setPage }) {
  const T = window.JJTokens;
  const containerStyle = { maxWidth: T.container, margin: '0 auto', padding: `0 ${T.pad}` };
  const h2 = { fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(1.8rem,3vw,2.4rem)', letterSpacing:'-0.03em', marginBottom:28, color:T.fg1 };
  const p = { fontFamily:T.fontBody, fontSize:'0.95rem', color:T.fg2, lineHeight:1.8, marginBottom:16 };

  return (
    <div style={{ background:T.bg, paddingTop:'clamp(80px,12vw,130px)', paddingBottom:T.sectionGap }}>
      {/* Marquee */}
      <div style={{ overflow:'hidden', marginBottom:64, maskImage:'linear-gradient(to right,transparent,black 8%,black 92%,transparent)' }}>
        <div style={{ display:'flex', width:'max-content', animation:'marquee 20s linear infinite' }}>
          {['ABOUT ME','●','SOBRE MIM','ABOUT ME','●','SOBRE MIM','ABOUT ME','●','SOBRE MIM'].map((w,i)=>(
            <span key={i} style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(4rem,9vw,7rem)', color:'rgba(28,26,23,0.05)', whiteSpace:'nowrap', letterSpacing:'-0.03em', padding:'0 28px' }}>{w}</span>
          ))}
        </div>
      </div>

      <div style={containerStyle}>
        {/* Why */}
        <section style={{ marginBottom:72 }}>
          <h2 style={h2}>What is my 'why'?</h2>
          <p style={p}>I believe that every product designer should step into the shoes of their users, and learn from them day in and day out, to truly understand and meet their needs. By doing so, we can empower businesses to create products that genuinely resonate with their audience.</p>
          <p style={p}>Everyday, my enthusiasm is fueled by a strong connection to the product and its people, an in-depth immersion in its development, and a continuous learning journey from user feedback and interactions.</p>
        </section>

        {/* About grid */}
        <section style={{ marginBottom:72 }}>
          <h2 style={h2}>About me</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40 }}>
            {[
              { title: "I'm...", items: ['An Enneagram type 5', 'An INTJ-A'] },
              { title: 'Values', items: ['Awareness', 'Creativity', 'Precision', 'Respect', 'Gratitude'] },
              { title: 'Passions', items: ['Product Design', 'Music production, Drums', 'VR', 'Gaming', 'Football'] },
            ].map((col, i) => (
              <div key={i}>
                <h3 style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'1.1rem', letterSpacing:'-0.02em', marginBottom:16, color:T.fg1 }}>{col.title}</h3>
                <ul style={{ listStyle:'none', padding:0 }}>
                  {col.items.map((item, j) => (
                    <li key={j} style={{ fontFamily:T.fontBody, fontSize:'0.9rem', color:T.fg2, padding:'5px 0' }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Journey */}
        <section style={{ marginBottom:72 }}>
          <h2 style={h2}>My journey</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'40px 60px' }}>
            {[
              "From a young age, I've been innately drawn to creative pursuits. This passion initially led me to start designing themes for hi5 at the age of 15, where 2 of my themes attracted over 50,000 concurrent users.",
              "Throughout my studies, I explored various design disciplines, including illustration, motion graphics, and service design. These experiences equipped me with a holistic understanding of what makes a product succeed.",
              "It wasn't long before I realized my true calling lay at the intersection of technology and design. This discovery steered me towards digital product design.",
              "Since 2015, I've gained extensive experience at Be.Ubi, Namecheap, Talkdesk, Hopin, StreamYard, and Anchorage Digital — spanning various industries, teams, and project requirements.",
            ].map((text, i) => (
              <p key={i} style={p}>{text}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function JJContactPage() {
  const T = window.JJTokens;
  return (
    <div style={{ background:T.dark, color:T.fgInverse, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding:T.pad }}>
      <div>
        <h2 style={{ fontFamily:T.fontDisplay, fontWeight:900, fontSize:'clamp(2rem,4vw,3.2rem)', letterSpacing:'-0.035em', lineHeight:1.2, marginBottom:40, color:T.fgInverse }}>
          Thanks for the visit.<br/>Let's chat.
        </h2>
        <div style={{ display:'flex', gap:16, justifyContent:'center', marginBottom:48 }}>
          <a href="mailto:jjacinto.mail@gmail.com"
            style={{ padding:'14px 36px', borderRadius:T.radiusFull, background:T.accent, color:'#fff', fontFamily:T.fontBody, fontSize:'0.9rem', textDecoration:'none', transition:'all 0.25s' }}>
            Contact me
          </a>
          <button style={{ padding:'14px 36px', borderRadius:T.radiusFull, border:`1.5px solid rgba(255,255,255,0.25)`, background:'transparent', color:T.fgInverse, fontFamily:T.fontBody, fontSize:'0.9rem', cursor:'pointer' }}>
            View my CV
          </button>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:60, flexWrap:'wrap' }}>
          {[
            { label:'Email', value:'jjacinto.mail@gmail.com' },
            { label:'LinkedIn', value:'linkedin.com/in/joaofranciscojacinto' },
            { label:'Location', value:'Aveiro, Portugal' },
          ].map((item,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:T.fontBody, fontSize:'0.72rem', color:'rgba(240,237,232,0.45)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{item.label}</div>
              <div style={{ fontFamily:T.fontBody, fontSize:'0.9rem', color:T.fgInverse }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { JJCasesPage, CaseCard, JJAboutPage, JJContactPage });
