import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'UniFiles — Apuntes y exámenes universitarios',
  description:
    'Plataforma para compartir apuntes, exámenes y resúmenes entre estudiantes universitarios.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Navbar />
        <main className="py-8">{children}</main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-sm text-gray-500 sm:flex-row">
            <p>© {new Date().getFullYear()} UniFiles</p>
            <p>Hecho por y para estudiantes.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
