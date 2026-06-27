'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AuthShell, FloatingInput } from '@/components/AuthShell';
import { useToast } from '@/components/Toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(
        updateError.message.includes('session')
          ? 'El link expiró o no es válido. Pedí uno nuevo.'
          : updateError.message
      );
      return;
    }

    toast('Contraseña actualizada correctamente', 'success');
    router.push('/auth/login');
  }

  return (
    <AuthShell
      title="Nueva contraseña"
      subtitle="Elegí una contraseña para tu cuenta."
      footer={null}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <FloatingInput
          id="password"
          label="Nueva contraseña"
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
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full !rounded-xl"
          disabled={loading}
        >
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </AuthShell>
  );
}
