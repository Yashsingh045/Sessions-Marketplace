import "./globals.css";

import Navbar from "../components/Navbar";
import { AuthProvider } from "../lib/auth-context";
import { ToastProvider } from "../lib/toast-context";

export const metadata = {
  title: "Sessions Marketplace",
  description: "Browse, book and host live sessions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <main className="main">{children}</main>
            <footer className="footer">
              <div className="container">Sessions Marketplace · demo</div>
            </footer>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
