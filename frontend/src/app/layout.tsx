import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider, THEME_BOOTSTRAP_SCRIPT } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { UserProvider } from "@/context/UserContext";
import { AUTHOR } from "@/lib/author";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: "Duolingo Clone — Learn Spanish",
  description: `A Duolingo-style language learning app: learning path, lessons, XP, streaks and hearts. Built by ${AUTHOR.name}.`,
  authors: [{ name: AUTHOR.name }],
  creator: AUTHOR.name,
};

export const viewport: Viewport = {
  themeColor: "#58cc02",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <UserProvider>{children}</UserProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
