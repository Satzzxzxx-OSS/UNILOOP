import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "UNILOOP — Discover, buy and rent",
    template: "%s | UNILOOP",
  },
  description:
    "A thoughtful local marketplace to discover useful items, share what you no longer need and rent what you need.",
  applicationName: "UNILOOP",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <div>
              <span className="footer-brand">UNILOOP</span>
              <p>A better way to keep useful things in the loop.</p>
            </div>
            <div className="footer-links" aria-label="Footer">
              <a href="/explore?mode=buy">Explore</a>
              <a href="/explore?mode=rent">Rent</a>
              <a href="/#how-it-works">How it works</a>
            </div>
            <p className="footer-note">An evolving marketplace. Features are released only when ready.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
