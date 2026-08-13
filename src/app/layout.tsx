import type { Metadata } from "next";
import { Bricolage_Grotesque, Work_Sans, Assistant } from "next/font/google";
import "./globals.css";

// Bricolage and Work Sans carry the Latin text. Neither has Hebrew or
// Cyrillic glyphs, so Assistant sits behind both in the stack — browsers
// fall back per character, which means Hebrew deck titles and Russian
// translations resolve to a chosen face rather than a system default.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display-latin",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-latin",
});

const assistant = Assistant({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hebrew",
});

export const metadata: Metadata = {
  title: "iamhebrew",
  description: "Personal Hebrew tutoring — lessons, drills, and practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${workSans.variable} ${assistant.variable} h-full antialiased`}
      style={
        {
          "--font-heading":
            "var(--font-display-latin), var(--font-hebrew), system-ui, sans-serif",
          "--font-body":
            "var(--font-body-latin), var(--font-hebrew), system-ui, sans-serif",
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col bg-bg font-body text-text">
        {children}
      </body>
    </html>
  );
}
