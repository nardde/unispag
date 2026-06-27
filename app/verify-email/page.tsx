'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AuthShell } from '@/components/AuthShell';
import { useToast } from '@/components/Toast';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  async function resend() {
    if (!email) {
      toast('No tenemos tu email. Volvé a registrarte.', 'error');
      return;
    }
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setSending(false);
    if (error) {
      toast('No se pudo reenviar. Probá más tarde.', 'error');
      return;
    }
    toast('Te reenviamos el email de confirmación', 'success');
  }

  return (
    <AuthShell
      title="Verificá tu email"
      subtitle="Falta un paso para empezar a subir archivos."
      footer={
        <Link
          href="/auth/login"
          className="font-medium text-brand-500 hover:underline"
        >
          Ya lo confirmé — iniciar sesión
        </Link>
      }
    >
      <div className="space-y-4 text-center">
        <p className="text-sm text-subtle">
          {email ? (
            <>
              Te enviamos un email a{' '}
              <span className="font-medium text-ink">{email}</span>. Confirmá tu
              cuenta para empezar a subir archivos.
            </>
          ) : (
            'Te enviamos un email de confirmación. Revisalo para activar tu cuenta.'
          )}
        </p>
        <p className="text-xs text-subtle">
          Mientras tanto podés navegar y descargar archivos sin restricciones.
        </p>
        <button
          onClick={resend}
          disabled={sending}
          className="btn-secondary w-full !rounded-xl"
        >
          {sending ? 'Reenviando…' : 'Reenviar email'}
        </button>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
