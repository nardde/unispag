'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { AuthShell, FloatingInput } from '@/components/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Ingresá tu email.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/reset-password`
            : undefined,
      }
    );
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Revisá tu email"
        subtitle="Te enviamos un link para restablecer tu contraseña."
        footer={
          <Link
            href="/auth/login"
            className="font-medium text-brand-500 hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        }
      >
        <p className="text-center text-sm text-subtle">
          Si existe una cuenta con{' '}
          <span className="font-medium text-ink">{email}</span>, vas a recibir un
          email con instrucciones para restablecer tu contraseña.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te enviaremos un link para crear una nueva."
      footer={
        <Link
          href="/auth/login"
          className="font-medium text-brand-500 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
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

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full !rounded-xl"
          disabled={loading}
        >
          {loading ? 'Enviando…' : 'Enviar link'}
        </button>
      </form>
    </AuthShell>
  );
}
