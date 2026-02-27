import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const roboto = Roboto({ 
  weight: ['400', '500', '700'],
  subsets: ["latin"] 
});

export const metadata: Metadata = {
  title: 'Automated Data Processing & Detection Tool',
  description: 'Professional data analysis and processing tool with automated detection capabilities',
  generator: '',
  icons: {
    icon: [
      {
        url: '/logo.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/logo.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/logo.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
