import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-semibold text-brand-500">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-sm text-sm text-subtle">
        La universidad, carrera o página que buscás no existe o fue movida.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Volver al inicio
      </Link>
    </div>
  );
}
