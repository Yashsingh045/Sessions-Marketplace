import "./globals.css";

import Chrome from "../components/Chrome";
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
            <Chrome>{children}</Chrome>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
