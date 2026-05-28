import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { FeedCacheProvider } from './context/FeedCacheContext';
import EmotionCacheProvider from './lib/emotion-cache';
import ThemeProvider from './lib/theme-provider';
import ScrollRestorer from './components/layout/ScrollRestorer';

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Circuito Sertanejo - Application Event",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo/logo-circuito.png",
    apple: "/logo/logo-circuito.png",
  },
  appleWebApp: {
    title: "Circuito Sertanejo App",
    statusBarStyle: "default",
    capable: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${montserrat.variable} antialiased`}
        style={{ fontFamily: 'var(--font-montserrat), "Montserrat", sans-serif' }}
      >
        <EmotionCacheProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <FeedCacheProvider>
                  <ScrollRestorer />
                  {children}
                </FeedCacheProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </EmotionCacheProvider>
      </body>
    </html>
  );
}
