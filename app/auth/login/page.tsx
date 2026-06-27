'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AuthShell, FloatingInput } from '@/components/AuthShell';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Completá tu email y contraseña.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : signInError.message
      );
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accedé para subir y gestionar archivos."
      footer={
        <p>
          ¿No tenés cuenta?{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-brand-500 hover:underline"
          >
            Registrate
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <FloatingInput
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <FloatingInput
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand-500 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full !rounded-xl"
          disabled={loading}
        >
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
