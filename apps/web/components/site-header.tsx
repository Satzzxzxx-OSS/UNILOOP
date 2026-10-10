import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/dashboard" className="brand" aria-label="UNILOOP home">
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
          <Link href="/my/listings">My listings</Link>
          <Link href="/rentals">Rentals</Link>
          <Link href="/transactions">Exchanges</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/inbox">Inbox</Link>
          <Link href="/saved">Saved</Link>
          <Link href="/notifications">Activity</Link>
          <Link href="/#how-it-works">How it works</Link>
        </nav>
        <div className="header-actions">
          <Link href="/notifications" className="account-link" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 8-3 9-3 9h18s-3-1-3-9ZM10 21h4"
                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </Link>
          <Link href="/inbox" className="account-link">Inbox</Link>
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
        <Link href="/inbox">Inbox</Link>
        <Link href="/offers">Offers</Link>
        <Link href="/notifications">Activity</Link>
        <Link href="/rentals">Rentals</Link>
        <Link href="/saved">Saved</Link>
        <Link href="/account">Account</Link>
      </nav>
    </header>
  );
}
