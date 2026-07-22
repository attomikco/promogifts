import type { Metadata } from 'next'
import { Poppins, Libre_Baskerville } from 'next/font/google'
import Script from 'next/script'
import { QuoteCartProvider } from '@/components/QuoteCartProvider'
import QuoteCartWidget from '@/components/QuoteCartWidget'
import './globals.css'

const gtmId = process.env.NEXT_PUBLIC_GTM_ID

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | Promogifts México',
    default:
      'Promogifts | Artículos Promocionales y Regalos Corporativos en México',
  },
  description:
    'Más de 1,000 artículos promocionales con personalización de logo. Termos, bolsas, plumas, tecnología y más. Envíos a toda la República Mexicana.',
  metadataBase: new URL('https://promogifts.com.mx'),
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    locale: 'es_MX',
    type: 'website',
    siteName: 'Promogifts México',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Promogifts - Artículos Promocionales y Regalos Corporativos en México',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'geo.region': 'MX',
    'geo.country': 'Mexico',
    language: 'es-MX',
  },
  alternates: {
    languages: {
      'es-MX': 'https://promogifts.com.mx',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${poppins.variable} ${libreBaskerville.variable}`}>
      <head>
        {gtmId && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`,
              }}
            />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: 'Promogifts',
                  url: 'https://promogifts.com.mx',
                  description:
                    'Artículos promocionales y regalos corporativos en México',
                },
                {
                  '@type': 'WebSite',
                  name: 'Promogifts México',
                  url: 'https://promogifts.com.mx',
                },
              ],
            }),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <QuoteCartProvider>
          {children}
          <QuoteCartWidget />
        </QuoteCartProvider>
      </body>
    </html>
  )
}
