'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { AvatarUploader } from '@/components/AvatarUploader';
import { SearchMultiSelect, type Option } from '@/components/SearchMultiSelect';

interface Uni {
  id: string;
  name: string;
  acronym: string | null;
}
interface Career {
  id: string;
  name: string;
  university_id: string;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
type NameStatus = 'idle' | 'checking' | 'ok' | 'taken' | 'invalid';

export function EditProfileForm({
  userId,
  initial,
  universities,
  careers,
  initialUnis,
  initialCareers,
}: {
  userId: string;
  initial: {
    username: string;
    bio: string | null;
    year_of_study: number | null;
    avatar_url: string | null;
  };
  universities: Uni[];
  careers: Career[];
  initialUnis: string[];
  initialCareers: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio ?? '');
  const [year, setYear] = useState<number | ''>(initial.year_of_study ?? '');
  const [selUnis, setSelUnis] = useState<string[]>(initialUnis);
  const [selCareers, setSelCareers] = useState<string[]>(initialCareers);
  const [nameStatus, setNameStatus] = useState<NameStatus>('idle');
  const [saving, setSaving] = useState(false);

  // Real-time username uniqueness check (debounced).
  useEffect(() => {
    if (username === initial.username) {
      setNameStatus('idle');
      return;
    }
    if (!USERNAME_RE.test(username)) {
      setNameStatus('invalid');
      return;
    }
    setNameStatus('checking');
    const t = setTimeout(async () => {
      const { data } = await createClient()
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .neq('id', userId)
        .maybeSingle();
      setNameStatus(data ? 'taken' : 'ok');
    }, 400);
    return () => clearTimeout(t);
  }, [username, initial.username, userId]);

  const uniOptions: Option[] = universities.map((u) => ({
    id: u.id,
    label: u.name,
    sublabel: u.acronym ?? undefined,
  }));
  const careerOptions: Option[] = careers
    .filter((c) => selUnis.length === 0 || selUnis.includes(c.university_id))
    .map((c) => {
      const uni = universities.find((u) => u.id === c.university_id);
      return { id: c.id, label: c.name, sublabel: uni?.acronym ?? uni?.name };
    });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (nameStatus === 'taken' || nameStatus === 'invalid') {
      toast('Revisá el nombre de usuario.', 'error');
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        bio: bio.trim() || null,
        year_of_study: year === '' ? null : year,
      })
      .eq('id', userId);

    if (error) {
      setSaving(false);
      toast(
        error.code === '23505'
          ? 'Ese nombre de usuario ya está en uso.'
          : 'No se pudieron guardar los cambios.',
        'error'
      );
      return;
    }

    await supabase.from('user_universities').delete().eq('user_id', userId);
    await supabase.from('user_careers').delete().eq('user_id', userId);
    if (selUnis.length)
      await supabase
        .from('user_universities')
        .insert(selUnis.map((id) => ({ user_id: userId, university_id: id })));
    if (selCareers.length)
      await supabase
        .from('user_careers')
        .insert(selCareers.map((id) => ({ user_id: userId, career_id: id })));

    toast('Cambios guardados', 'success');
    router.push(`/profile/${username}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-6">
      <div className="flex justify-center">
        <AvatarUploader
          userId={userId}
          username={username}
          avatarUrl={initial.avatar_url}
        />
      </div>

      <div>
        <label className="label" htmlFor="username">
          Nombre de usuario
        </label>
        <div className="relative">
          <input
            id="username"
            className="input pr-10"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
            {nameStatus === 'checking' && <span className="text-subtle">…</span>}
            {nameStatus === 'ok' && <span className="text-emerald-600">✓</span>}
            {(nameStatus === 'taken' || nameStatus === 'invalid') && (
              <span className="text-rose-600">✕</span>
            )}
          </span>
        </div>
        {nameStatus === 'invalid' && (
          <p className="mt-1 text-xs text-rose-600">
            3 a 20 caracteres: letras, números o guion bajo.
          </p>
        )}
        {nameStatus === 'taken' && (
          <p className="mt-1 text-xs text-rose-600">Ese usuario ya existe.</p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          className="input min-h-[72px] resize-y"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 160))}
          placeholder="Contá algo sobre vos (opcional)"
          maxLength={160}
        />
        <p className="mt-1 text-right text-xs text-subtle">{bio.length}/160</p>
      </div>

      <div>
        <label className="label" htmlFor="year">
          Año que cursás
        </label>
        <select
          id="year"
          className="input"
          value={year}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">—</option>
          {[1, 2, 3, 4, 5, 6].map((y) => (
            <option key={y} value={y}>
              {y}° año
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Universidad/es</label>
        <SearchMultiSelect
          options={uniOptions}
          selected={selUnis}
          onChange={setSelUnis}
          placeholder="Buscar universidad…"
        />
      </div>

      <div>
        <label className="label">Carrera/s</label>
        <SearchMultiSelect
          options={careerOptions}
          selected={selCareers}
          onChange={setSelCareers}
          placeholder="Buscar carrera…"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Link href={`/profile/${initial.username}`} className="btn-secondary">
          Cancelar
        </Link>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
