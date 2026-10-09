import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="UNILOOP home">
          <span className="brand-icon" aria-hidden="true">
            <span className="brand-ring brand-ring-one" />
            <span className="brand-ring brand-ring-two" />
            <span className="brand-center" />
          </span>
          <span>UNI<span className="brand-accent">LOOP</span></span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          <Link href="/explore?mode=buy">Buy</Link>
          <Link href="/explore?mode=rent">Rent</Link>
          <Link href="/#categories">Categories</Link>
          <Link href="/#how-it-works">How it works</Link>
        </nav>
        <div className="header-actions">
          <Link href="/account" className="account-link">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="18" height="18">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M5 20c.4-4.2 2.7-6.1 7-6.1s6.6 1.9 7 6.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <span>Account</span>
          </Link>
          <Link href="/post" className="button button-dark header-post">
            <span aria-hidden="true">＋</span> Post an item
          </Link>
        </div>
      </div>
      <nav className="mobile-nav container" aria-label="Mobile navigation">
        <Link href="/explore?mode=buy">Buy</Link>
        <Link href="/explore?mode=rent">Rent</Link>
        <Link href="/#categories">Categories</Link>
        <Link href="/post">Post</Link>
        <Link href="/account">Account</Link>
      </nav>
    </header>
  );
}
