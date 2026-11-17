import type { Metadata, Viewport } from "next";
import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/site/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CHARON — Personal Digital Identity",
  description:
    "Технологии, искусственный интеллект, цифровые продукты и эксперименты на пересечении идей и разработки. Персональное цифровое пространство Charon.",
  keywords: [
    "Charon",
    "digital identity",
    "AI",
    "цифровые продукты",
    "web-разработка",
    "автоматизация",
    "криптовалютная аналитика",
  ],
  authors: [{ name: "Charon" }],
  openGraph: {
    title: "CHARON — Personal Digital Identity",
    description:
      "Технологии, искусственный интеллект, цифровые продукты и эксперименты на пересечении идей и разработки.",
    siteName: "Charon",
    type: "website",
    locale: "ru_RU",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#131418" },
    { media: "(prefers-color-scheme: light)", color: "#efefee" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${unbounded.variable} ${manrope.variable} ${jetbrains.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
