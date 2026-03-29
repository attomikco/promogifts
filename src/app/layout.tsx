import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
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
    <html lang="es" className={poppins.variable}>
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
