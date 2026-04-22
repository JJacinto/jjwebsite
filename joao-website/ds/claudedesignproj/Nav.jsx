// JJ Website — Nav Component
function JJNav({ page, setPage }) {
  const T = window.JJTokens;
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const el = document.getElementById('jj-scroll-root');
    const handler = () => setScrolled((el?.scrollTop || window.scrollY) > 40);
    el?.addEventListener('scroll', handler);
    window.addEventListener('scroll', handler);
    return () => { el?.removeEventListener('scroll', handler); window.removeEventListener('scroll', handler); };
  }, []);

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    padding: '0 40px',
    height: 64,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: scrolled ? 'rgba(236,234,229,0.90)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
    boxShadow: scrolled ? `0 1px 0 ${T.border}` : 'none',
    transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
  };

  const logoStyle = {
    display: 'flex', alignItems: 'center', cursor: 'pointer',
    width: 36, height: 26,
  };

  const capsuleStyle = {
    display: 'flex', gap: 2,
    background: scrolled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
    borderRadius: T.radiusFull, padding: '4px',
    transition: 'background 0.3s',
  };

  const linkStyle = (isActive) => ({
    fontFamily: T.fontBody, fontSize: '0.875rem',
    color: isActive ? T.fg1 : T.fg2,
    padding: '7px 20px', borderRadius: T.radiusFull, cursor: 'pointer',
    background: isActive ? 'rgba(255,255,255,0.95)' : 'transparent',
    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.2s', border: 'none', userSelect: 'none',
    fontWeight: isActive ? 500 : 400,
  });

  const inStyle = {
    width: 36, height: 36, border: `1.5px solid ${T.borderStrong}`,
    borderRadius: T.radiusSm, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700,
    color: T.fg1, cursor: 'pointer', fontFamily: T.fontBody,
    textDecoration: 'none', transition: 'all 0.2s',
  };

  const pages = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'cases', label: 'Case studies' },
    { id: 'contact', label: 'Contact' },
  ];

  const isActive = (id) => page === id || (id === 'cases' && page?.startsWith('case-'));

  return (
    <nav style={navStyle}>
      <div style={logoStyle} onClick={() => setPage('home')}>
        <img src="assets/JJ.svg" alt="JJ" style={{ width: 30, height: 26 }}
          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
        <div style={{ display:'none', fontFamily:T.fontDisplay, fontWeight:900, fontSize:'1.3rem', letterSpacing:'-0.04em', color:T.fg1 }}>J</div>
      </div>

      <div style={capsuleStyle}>
        {pages.map(p => (
          <button key={p.id}
            style={linkStyle(isActive(p.id))}
            onClick={() => setPage(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <a href="https://linkedin.com/in/joaofranciscojacinto/" target="_blank" rel="noopener noreferrer"
        style={inStyle}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.fg1; e.currentTarget.style.background = T.fg1; e.currentTarget.style.color = T.fgInverse; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.fg1; }}>
        in
      </a>
    </nav>
  );
}

Object.assign(window, { JJNav });
