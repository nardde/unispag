'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { storagePathFromUrl } from '@/lib/utils';

export function DeleteFileButton({
  fileId,
  fileUrl,
  title,
}: {
  fileId: string;
  fileUrl: string;
  title: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`))
      return;
    setBusy(true);
    const supabase = createClient();
    const path = storagePathFromUrl(fileUrl);
    if (path) await supabase.storage.from('files').remove([path]);
    const { error } = await supabase.from('files').delete().eq('id', fileId);
    setBusy(false);
    if (error) {
      toast('No se pudo eliminar el archivo', 'error');
      return;
    }
    toast('Archivo eliminado', 'success');
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-50"
    >
      {busy ? 'Eliminando…' : 'Eliminar'}
    </button>
  );
}
