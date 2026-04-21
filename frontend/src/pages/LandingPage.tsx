import { Link } from 'react-router-dom';
import heroImg from '../assets/hero.png';

const FEATURES = [
  { icon: '💵', title: 'Multi-currency fiat', desc: 'Hold USD, EUR, GBP, JPY and SGD wallets in one place.' },
  { icon: '₿', title: 'Crypto wallets',       desc: 'Native ETH and BTC accounts with on-chain addresses.' },
  { icon: '↗',  title: 'Instant transfers',    desc: 'Send money between accounts with a flat 0.1 % fee.' },
  { icon: '⇄',  title: 'Fiat ↔ Crypto swap',  desc: 'Exchange any pair at live rates (0.5 % fee).' },
  { icon: '🔒', title: 'Secure by default',    desc: 'bcrypt passwords, JWT auth, rate-limiting, and Helmet.' },
  { icon: '🪪', title: 'KYC built-in',         desc: 'Submit identity documents and track verification status.' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <span className="landing-logo">💳 Wallet</span>
        <div className="landing-nav-links">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-text">
          <h1 className="hero-headline">
            One wallet.<br />Every currency.
          </h1>
          <p className="hero-sub">
            Manage fiat and crypto accounts, send money instantly,
            and swap currencies — all from a single dashboard.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn-primary btn-lg">Create free account</Link>
            <Link to="/login"    className="btn-ghost  btn-lg">Sign in</Link>
          </div>
        </div>
        <div className="hero-img-wrap">
          <img src={heroImg} alt="Wallet illustration" className="hero-img" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features">
        <h2 className="features-title">Everything you need</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-name">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="cta-banner">
        <h2>Ready to get started?</h2>
        <p>Join today and open your first wallet in under a minute.</p>
        <Link to="/register" className="btn-primary btn-lg">Create account →</Link>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Wallet · Built with React &amp; Express</span>
      </footer>
    </div>
  );
}
