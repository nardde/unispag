'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AuthShell } from '@/components/AuthShell';
import { slugify } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): string | null {
    const u = slugify(username);
    if (!username.trim()) return 'Elegí un nombre de usuario.';
    if (u.length < 3) return 'El usuario debe tener al menos 3 caracteres (letras o números).';
    if (!email.trim()) return 'Ingresá tu email.';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
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

    // If email confirmation is disabled, a session is returned immediately.
    if (data.session) {
      router.push('/');
      router.refresh();
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <AuthShell
        title="Revisá tu email"
        subtitle="Te enviamos un enlace de confirmación."
        footer={
          <Link
            href="/auth/login"
            className="font-medium text-brand-600 hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        }
      >
        <p className="text-sm text-gray-600">
          Confirmá tu dirección de correo desde el enlace que enviamos a{' '}
          <span className="font-medium text-gray-900">{email}</span> para activar
          tu cuenta.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Registrate para compartir tus apuntes y exámenes."
      footer={
        <p>
          ¿Ya tenés cuenta?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-brand-600 hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="username">
            Nombre de usuario
          </label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="juanperez"
            maxLength={30}
            autoComplete="username"
          />
          {username.trim() && (
            <p className="mt-1 text-xs text-gray-400">
              Se mostrará como @{slugify(username) || '...'}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repetí la contraseña"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}
