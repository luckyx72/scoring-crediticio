import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'TokenOriginate • Debt Origination Dashboard',
  description: 'Boutique de originación y estructuración de deuda para PYMEs industriales.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} font-sans`}>
      <body className="antialiased bg-[#FAF9F7] text-[#111111]">
        {children}
      </body>
    </html>
  );
}
