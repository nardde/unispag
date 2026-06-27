import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Providers } from '@/components/Providers';

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
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <Navbar />
          <main className="py-10">{children}</main>
          <footer className="mt-16 border-t border-hairline/60 bg-surface">
            <div className="container-page flex flex-col items-center justify-between gap-2 py-8 text-sm text-subtle sm:flex-row">
              <p>© {new Date().getFullYear()} UniFiles</p>
              <p>Hecho por y para estudiantes.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
