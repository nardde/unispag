export function SetupNotice() {
  return (
    <div className="card border-amber-200 bg-amber-50 p-6">
      <h3 className="text-base font-semibold text-amber-900">
        Configuración de Supabase pendiente
      </h3>
      <p className="mt-1 text-sm text-amber-800">
        No se pudo conectar con la base de datos. Asegurate de:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
        <li>
          Copiar <code className="rounded bg-amber-100 px-1">.env.local.example</code>{' '}
          a <code className="rounded bg-amber-100 px-1">.env.local</code> y
          completar las claves de Supabase.
        </li>
        <li>Crear las tablas, el bucket y las políticas RLS (ver README).</li>
        <li>Reiniciar el servidor de desarrollo.</li>
      </ul>
    </div>
  );
}
