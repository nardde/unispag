'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { slugify } from '@/lib/utils';
import { CloseIcon } from '@/components/icons';

export function EditProfile({
  userId,
  currentUsername,
}: {
  userId: string;
  currentUsername: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = slugify(username);
    if (clean.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres (letras o números).');
      return;
    }
    if (clean === currentUsername) {
      setOpen(false);
      return;
    }
    setSaving(true);
    const { error: updateError } = await createClient()
      .from('profiles')
      .update({ username: clean })
      .eq('id', userId);

    if (updateError) {
      setError(
        updateError.code === '23505'
          ? 'Ese nombre de usuario ya está en uso.'
          : 'No se pudo actualizar el perfil.'
      );
      setSaving(false);
      return;
    }
    toast('Perfil actualizado', 'success');
    setOpen(false);
    router.replace(`/profile/${clean}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary">
        Editar perfil
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm animate-scale-in rounded-t-3xl bg-card p-6 shadow-apple-lg sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[19px] font-semibold text-ink">Editar perfil</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-subtle hover:bg-hairline/60"
                aria-label="Cerrar"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label" htmlFor="edit-username">
                  Nombre de usuario
                </label>
                <input
                  id="edit-username"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                />
                <p className="mt-1 text-xs text-subtle">
                  Se mostrará como @{slugify(username) || '...'}
                </p>
              </div>
              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
