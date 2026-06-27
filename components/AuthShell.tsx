export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="container-page flex justify-center">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-600">{footer}</div>
      </div>
    </div>
  );
}
