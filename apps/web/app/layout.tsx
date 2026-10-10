import type {Metadata,Viewport} from "next";
import type {ReactNode} from "react";
import Link from "next/link";
import {ExperienceHeader} from "@/components/experience/experience-header";
import "./globals.css";
import "./experience.css";

export const metadata:Metadata={
  title:{default:"UNILOOP — Buy better. Borrow smarter.",template:"%s · UNILOOP"},
  description:"Find your next useful thing. Buy, sell, rent and lend with thoughtful local connections.",
  applicationName:"UNILOOP",
  robots:{index:false,follow:false},
};
export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#f9f7f1"};

export default function RootLayout({children}:{children:ReactNode}){
  return <html lang="en">
    <body>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <ExperienceHeader/>
      <main id="main-content">{children}</main>
      <footer className="ux-footer">
        <div className="ux-shell">
          <div className="ux-footer-grid">
            <div>
              <Link href="/" className="ux-brand"><span className="ux-brand-symbol" aria-hidden="true"><i/><i/><b/></span><span>uni<span>loop</span><sup>™</sup></span></Link>
              <p className="ux-footer-message">Less unused stuff. More great stories.
                A more thoughtful way to find, share and enjoy useful things.</p>
            </div>
            <nav className="ux-footer-list" aria-label="Marketplace footer">
              <strong>MARKETPLACE</strong>
              <Link href="/explore?mode=buy">Discover & buy</Link>
              <Link href="/explore?mode=rent">Explore rentals</Link>
              <Link href="/post">Sell an item</Link>
              <Link href="/rent/post">Rent out an item</Link>
            </nav>
            <nav className="ux-footer-list" aria-label="Account footer">
              <strong>YOUR LOOP</strong>
              <Link href="/account">Account</Link>
              <Link href="/saved">Saved items</Link>
              <Link href="/inbox">Messages</Link>
              <Link href="/rentals">Rental activity</Link>
              <Link href="/safety">Exchange safety</Link>
              <Link href="/help">Help & guidance</Link>
            </nav>
          </div>
          <div className="ux-footer-bottom">
            <span>© {new Date().getFullYear()} UNILOOP. Crafted to keep good things moving.</span>
            <span>Browse thoughtfully · Exchange safely · Keep it in the loop</span>
          </div>
        </div>
      </footer>
    </body>
  </html>;
}
