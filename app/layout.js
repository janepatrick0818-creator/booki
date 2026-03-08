import './globals.css'

export const metadata = {
  title: 'Booki - Discover, Read & Listen to Books',
  description: 'A modern platform to discover, read ebooks and listen to audiobooks. Your personal Netflix for books.',
  manifest: '/manifest.json',
  themeColor: '#141414',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#141414" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-[#141414] text-[#E5E5E5] antialiased">
        {children}
      </body>
    </html>
  )
}
