'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/Avatar';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export function AvatarUploader({
  userId,
  username,
  avatarUrl,
  size = 96,
}: {
  userId: string;
  username: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(avatarUrl);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast('Formato no válido. Usá JPG, PNG o WEBP.', 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast('La imagen supera los 5 MB.', 'error');
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${userId}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setBusy(false);
      toast('No se pudo subir la imagen.', 'error');
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path);
    const busted = `${publicUrl}?v=${Date.now()}`;

    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ avatar_url: busted })
      .eq('id', userId);
    setBusy(false);
    if (dbErr) {
      toast('No se pudo guardar la foto.', 'error');
      return;
    }
    setUrl(busted);
    toast('Foto actualizada', 'success');
    router.refresh();
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Avatar username={username} avatarUrl={url} size={size} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-apple ring-2 ring-card transition hover:bg-brand-600 disabled:opacity-60"
        aria-label="Cambiar foto"
        title="Cambiar foto de perfil"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="M3 7.5A1.5 1.5 0 0 1 4.5 6h1l1-1.5h5L12.5 6h1A1.5 1.5 0 0 1 15 7.5v6A1.5 1.5 0 0 1 13.5 15h-9A1.5 1.5 0 0 1 3 13.5v-6Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle cx="9" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
