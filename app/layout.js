import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientNav from "../components/ClientNav";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "ZalAI | Трекер тренувань",
  description: "Розумний трекер тренувань з концепцією Smart Logging",
  manifest: "/manifest.json",
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZalAI",
  },
};

export const viewport = {
  themeColor: "#080b10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { AppProvider } from "../context/AppContext";

export default function RootLayout({ children }) {
  return (
    <html lang="uk" className="bg-[#080b10]" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-[#080b10] text-white relative min-h-screen`}
        style={{ fontFamily: 'var(--font-space), system-ui, sans-serif' }}
      >
        <AppProvider>
          {/* ДОТ-ГРІД OVERLAY */}
          <div className="fixed inset-0 pointer-events-none z-[-2] dot-grid opacity-100" />

          {/* AMBIENT ORBS */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
            {/* Lime orb — верхній лівий */}
            <div
              className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full blur-[140px] opacity-20"
              style={{
                background: 'radial-gradient(circle, #A3E635 0%, transparent 70%)',
                animation: 'orb-float 24s ease-in-out infinite alternate'
              }}
            />
            {/* Cyan orb — правий середній */}
            <div
              className="absolute top-[25%] right-[-25%] w-[65vw] h-[65vw] rounded-full blur-[160px] opacity-12"
              style={{
                background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)',
                animation: 'orb-float 30s ease-in-out infinite alternate-reverse',
                animationDelay: '4s'
              }}
            />
            {/* Violet orb — нижній */}
            <div
              className="absolute bottom-[-15%] left-[15%] w-[80vw] h-[80vw] rounded-full blur-[180px] opacity-10"
              style={{
                background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)',
                animation: 'orb-float 36s ease-in-out infinite alternate',
                animationDelay: '10s'
              }}
            />
          </div>

          <div className="mx-auto w-full max-w-md relative z-10">
            {children}
          </div>
          <ClientNav />
        </AppProvider>
      </body>
    </html>
  );
}
