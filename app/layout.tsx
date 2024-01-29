import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font' })
// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'S-Market',
  description: 'S-Market',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className='w-full h-full'>
      <body className={montserrat.className}>{children}</body>
    </html>
  )
}
