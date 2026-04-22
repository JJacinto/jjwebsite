// JJ Design System — Nav Component
// Exports: JJNav

function JJNav({ page, setPage }) {
  const T = window.JJTokens;
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const el = document.getElementById('jj-scroll-root');
    const handler = () => setScrolled((el?.scrollTop || window.scrollY) > 30);
    el?.addEventListener('scroll', handler);
    window.addEventListener('scroll', handler);
    return () => { el?.removeEventListener('scroll', handler); window.removeEventListener('scroll', handler); };
  }, []);

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    padding: '18px 40px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: scrolled ? 'rgba(236,234,229,0.88)' : 'transparent',
    backdropFilter: scrolled ? 'blur(16px)' : 'none',
    boxShadow: scrolled ? `0 1px 0 ${T.border}` : 'none',
    transition: 'all 0.3s',
  };

  const logoStyle = {
    fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.3rem',
    letterSpacing: '-0.04em', width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: T.fg1,
  };

  const capsuleStyle = {
    display: 'flex', gap: 4,
    background: 'rgba(255,255,255,0.5)',
    borderRadius: T.radiusFull, padding: 4,
  };

  const linkStyle = (isActive) => ({
    fontFamily: T.fontBody, fontSize: '0.87rem', color: isActive ? T.fg1 : T.fg2,
    padding: '7px 18px', borderRadius: T.radiusFull, cursor: 'pointer',
    background: isActive ? 'rgba(255,255,255,0.85)' : 'transparent',
    transition: 'all 0.2s', border: 'none', userSelect: 'none',
  });

  const inStyle = {
    width: 36, height: 36, border: `1.5px solid ${T.border}`,
    borderRadius: T.radiusSm, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700,
    color: T.fg1, cursor: 'pointer', fontFamily: T.fontBody,
    textDecoration: 'none',
  };

  const pages = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'cases', label: 'Case studies' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <nav style={navStyle}>
      <div style={logoStyle} onClick={() => setPage('home')}>J</div>
      <div style={capsuleStyle}>
        {pages.map(p => (
          <span key={p.id} style={linkStyle(page === p.id || (p.id === 'cases' && page?.startsWith('case-')))}
            onClick={() => setPage(p.id)}>
            {p.label}
          </span>
        ))}
      </div>
      <a href="https://linkedin.com/in/joaofranciscojacinto/" target="_blank" style={inStyle}>in</a>
    </nav>
  );
}

Object.assign(window, { JJNav });
