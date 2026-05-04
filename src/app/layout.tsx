import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  // 🔹 Basic
  metadataBase: new URL("https://triviapath.vercel.app"),
  title: {
    default: "TriviaPath | Trivia Game Management System",
    template: "%s | TriviaPath",
  },
  description:
    "A fast, offline-first trivia game management system for live quiz sessions. Manage teams, rounds, scoring, and questions across multiple categories.",

  applicationName: "TriviaPath",

  // 🔹 Keywords (still useful for some engines + internal search)
  keywords: [
    "trivia app",
    "quiz management system",
    "game show software",
    "live trivia tool",
    "offline quiz app",
    "team trivia",
    "quiz scoring system",
    "education quiz platform",
    "church trivia",
    "science quiz",
    "geography quiz",
  ],

  // 🔹 Authors
  authors: [{ name: "Austin", url: "https://triviapath.vercel.app" }],
  creator: "Austin King'ori",
  publisher: "TriviaPath",

  // 🔹 Robots (SEO rules)
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // 🔹 Canonical
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
    },
  },

  // 🔹 Viewport (modern SEO requirement)
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },

  // 🔹 Theme
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],

  colorScheme: "light dark",

  // 🔹 Icons
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    shortcut: ["/apple-touch-icon.png"],
  },

  // 🔹 Manifest (PWA)
  manifest: "/manifest.json",

  // 🔹 Open Graph (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://triviapath.vercel.app",
    title: "TriviaPath | Trivia Game Management System",
    description:
      "Run live trivia sessions with ease. Manage teams, rounds, scoring, and questions in a fast, offline-first system.",
    siteName: "TriviaPath",
    images: [
      {
        url: "https://triviapath.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TriviaPath Trivia App",
      },
    ],
  },

  // 🔹 Twitter
  twitter: {
    card: "summary_large_image",
    title: "TriviaPath | Trivia Game Management",
    description:
      "A powerful offline-first trivia game engine for live sessions.",
    creator: "@IamKingOry",
    images: ["https://triviapath.vercel.app/og-image.jpg"],
  },

  // 🔹 App Links (deep linking)
  appLinks: {
    web: {
      url: "https://triviapath.vercel.app",
    },
  },

  // 🔹 Category (used by some engines)
  category: "education",

  // 🔹 Apple Web App (PWA iOS)
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TriviaPath",
  },

  // 🔹 Format detection (avoid unwanted auto-linking)
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // 🔹 Verification (SEO tools — fill later)
  verification: {
    google: "your-google-site-verification",
    yandex: "your-yandex-verification",
    yahoo: "your-yahoo-verification",
  },

  // 🔹 Referrer policy
  referrer: "origin-when-cross-origin",

  // 🔹 Abstract (optional but good for indexing)
  abstract:
    "An offline-first trivia game management platform for running live quiz sessions across multiple categories.",

  // 🔹 Classification
  classification: "Education, Productivity, Games",

  // 🔹 Generator (optional)
  generator: "Next.js",

  // 🔹 Other (custom meta tags)
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A1628]">{children}</body>
    </html>
  )
}
