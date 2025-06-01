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
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
