import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '../components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'タスク管理アプリ',
  description: 'スマホでも使えるPWA対応のタスク管理アプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png?v=2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>タスク管理アプリ</title>
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
