import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

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
    <html lang="es" className={mono.variable}>
      <body className="antialiased bg-[#050505] text-[#b3b3b3] font-mono">
        {children}
      </body>
    </html>
  );
}
