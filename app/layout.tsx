import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import './globals.css'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font' })
// const inter = Inter({ subsets: ["latin"] });
import dynamic from 'next/dynamic'
import React from 'react'
import { ENV_KEYS } from '@/lib/server_const'
const Providers = dynamic(() => import('./providers'), { ssr: false })

export const metadata: Metadata = {
  title: 'S-Market',
  description: 'S-Market',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const envs = ENV_KEYS.reduce((envs, key) => {
    return { ...envs, [key]: process.env[key] as any }
  }, {})
  return (
    <html lang='en' className='w-full h-full'>
      <body className={montserrat.className}>
        <div id='__envs__' style={{ display: 'none' }}>
          {JSON.stringify(envs)}
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
