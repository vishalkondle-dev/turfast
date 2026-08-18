import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Turfast — Book Your Game. Own Your Time.", template: "%s · Turfast" },
  description: "Discover and book sports turfs & venues near you. Football, cricket, badminton, pickleball and more. Real-time slots, instant booking, and open games.",
};

const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
