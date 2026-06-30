"use client";

import { usePathname } from "next/navigation";

import Navbar from "./Navbar";

// Dashboard routes use a sidebar app-shell. They keep the global top navbar
// (like every other page) but skip the <main> wrapper + footer so the shell can
// own the layout below the navbar.
const SHELL_ROUTES = ["/dashboard", "/creator"];

export default function Chrome({ children }) {
  const pathname = usePathname() || "/";
  const isShell = SHELL_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  if (isShell) {
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="main">{children}</main>
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <div className="brand-green">Ahoum</div>
            <p>© 2024 Ahoum. Elevating Consciousness through Technology.</p>
          </div>
          <nav className="footer-links">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Resources</a>
            <a href="#">Support</a>
            <a href="#">Newsletter</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
