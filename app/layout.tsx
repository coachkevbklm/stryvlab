import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

/* =====================================================
   FONT CONFIGURATION
   ===================================================== */
// 1. LUFGA (Principale / Corps de texte / "lab")
const lufga = localFont({
  src: [
    {
      path: "./fonts/Lufga/Lufga-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Lufga/Lufga-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Lufga/Lufga-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-lufga",
  display: "swap",
});

// 2. AZONIX (Logo "S" uniquement)
const azonix = localFont({
  src: "./fonts/AzonixRegular.woff2",
  variable: "--font-azonix",
  display: "swap",
});

// 3. ONEST (Logo "tryv" uniquement)
const onest = localFont({
  src: "./fonts/Onest/Onest-Bold.woff2",
  variable: "--font-onest",
  display: "swap",
});

// 4. UNBOUNDED (Logo "STRYV lab" — marque principale)
const unbounded = localFont({
  src: "../public/fonts/Unbounded-VariableFont_wght.ttf",
  variable: "--font-unbounded",
  display: "swap",
});

// 5. BARLOW + BARLOW CONDENSED (DS v3.0 — app client STRYVR)
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

/* =====================================================
   VIEWPORT
   ===================================================== */
export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/* =====================================================
   METADATA — STRYV lab
   ===================================================== */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),

  // manifest declared only in app/client/layout.tsx — not here (coach routes should not install client PWA)
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "STRYV",
  },

  title: {
    default: "STRYV lab",
    template: "%s | STRYV lab",
  },

  description:
    "STRYV lab est une plateforme d’analyse et d’optimisation personnalisée basée sur des données réelles, orientée performance et transformation durable.",

  keywords: [
    "STRYV lab",
    "smart fitness",
    "coaching intelligent",
    "analyse de performance",
    "optimisation personnalisée",
    "transformation basée sur les données",
    "IPT",
    "Mons",
    "Belgique",
  ],

  authors: [{ name: "STRYV lab" }],
  creator: "STRYV lab",
  publisher: "STRYV lab",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  },

  other: {
    "geo.region": "BE-WHT",
    "geo.placename": "Mons",
    "geo.position": "50.4542;3.9567",
    ICBM: "50.4542, 3.9567",
  },

  openGraph: {
    title: "STRYV lab",
    description: "Optimisation personnalisée basée sur les données.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    siteName: "STRYV lab",
    locale: "fr_BE",
    type: "website",
    images: [
      {
        url: "/images/og-stryv.png",
        width: 1200,
        height: 630,
        alt: "STRYV lab",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "STRYV lab",
    description: "Optimisation personnalisée basée sur les données.",
    images: ["/images/og-stryv.png"],
  },
};

/* =====================================================
   STRUCTURED DATA — SCHEMA.ORG
   ===================================================== */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ResearchOrganization", "ProfessionalService"],
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/#organization`,
      name: "STRYV lab",
      alternateName: ["STRYV", "STRYV Smartfit"],
      description:
        "Plateforme d’analyse et d’optimisation personnalisée basée sur des données réelles.",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/logo-stryv.png`,
      image: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/images/og-stryv.png`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Mons",
        postalCode: "7000",
        addressCountry: "BE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 50.4542,
        longitude: 3.9567,
      },
      areaServed: "BE",
      knowsAbout: [
        "analyse de performance",
        "optimisation personnalisée",
        "systèmes adaptatifs",
        "adhérence comportementale",
        "optimisation long terme",
        "modélisation adaptative",
        "évaluation de capacité de transformation",
      ],
      sameAs: [
        process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
        process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/#website`,
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      name: "STRYV lab",
      publisher: {
        "@id": `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/#organization`,
      },
      inLanguage: "fr-BE",
    },
  ],
};

/* =====================================================
   ROOT LAYOUT
   ===================================================== */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Injection des 3 variables de police pour utilisation CSS globale
    <html
      lang="fr"
      className={cn(
        lufga.variable,
        azonix.variable,
        onest.variable,
        unbounded.variable,
        barlow.variable,
        barlowCondensed.variable,
        "font-sans",
      )}
    >
      <body className="antialiased min-h-screen bg-background text-primary">
        {/* Native splash — pure HTML/CSS, shows before any JS, only on /client routes */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          #stryvr-splash {
            position: fixed; inset: 0; z-index: 9999;
            background: #0d0d0d;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 0;
            transition: opacity 0.4s ease;
          }
          #stryvr-splash.fade { opacity: 0; pointer-events: none; }
          #stryvr-splash img {
            width: 80px; height: 80px;
            animation: splashLogo 3s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
            transform-origin: center center;
          }
          @keyframes splashLogo {
            0% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.08) rotate(180deg); }
            50% { transform: scale(1.08) rotate(180deg); }
            75% { transform: scale(1.08) rotate(360deg); }
            100% { transform: scale(1) rotate(360deg); }
          }
        `,
          }}
        />
        <div id="stryvr-splash">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/Logo%20STRYVR%20(silver).png" alt="STRYVR" />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            // Only show on /client routes
            if (!window.location.pathname.startsWith('/client')) {
              var s = document.getElementById('stryvr-splash');
              if (s) s.style.display = 'none';
              return;
            }

            var s = document.getElementById('stryvr-splash');
            if (!s) return;

            if (sessionStorage.getItem('stryvr_splash_seen')) {
              s.style.display = 'none';
              return;
            }
            sessionStorage.setItem('stryvr_splash_seen', '1');

            window.addEventListener('load', function() {
              setTimeout(function() {
                if (s) {
                  s.classList.add('fade');
                  setTimeout(function() { if (s.parentNode) s.parentNode.removeChild(s); }, 450);
                }
              }, 1200);
            });
          })();
        `,
          }}
        />
        <TooltipProvider delay={300}>{children}</TooltipProvider>

        {/* SCHEMA.ORG */}
        <Script
          id="stryv-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
