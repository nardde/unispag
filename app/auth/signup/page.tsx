'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AuthShell, FloatingInput } from '@/components/AuthShell';
import { slugify } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    const u = slugify(username);
    if (!username.trim()) return 'Elegí un nombre de usuario.';
    if (u.length < 3)
      return 'El usuario debe tener al menos 3 caracteres (letras o números).';
    if (!email.trim()) return 'Ingresá tu email.';
    if (password.length < 6)
      return 'La contraseña debe tener al menos 6 caracteres.';
    if (password !== confirm) return 'Las contraseñas no coinciden.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const cleanUsername = slugify(username);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: cleanUsername },
        emailRedirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push('/');
      router.refresh();
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Registrate para compartir tus apuntes."
      footer={
        <p>
          ¿Ya tenés cuenta?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-brand-500 hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <FloatingInput
            id="username"
            label="Nombre de usuario"
            autoComplete="username"
            value={username}
            onChange={setUsername}
            maxLength={30}
          />
          {username.trim() && (
            <p className="mt-1 pl-1 text-xs text-subtle">
              Se mostrará como @{slugify(username) || '...'}
            </p>
          )}
        </div>
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
          label="Contraseña (mín. 6)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
        <FloatingInput
          id="confirm"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
        />

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
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}
