import type { Metadata } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '700', '800'],
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
  openGraph: {
    locale: 'es_MX',
    type: 'website',
    siteName: 'Promogifts México',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${syne.variable}`}>
      <head>
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
