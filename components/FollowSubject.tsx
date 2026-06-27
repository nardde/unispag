'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { useToast } from '@/components/Toast';
import { BellIcon } from '@/components/icons';

export function FollowSubject({ subjectId }: { subjectId: string }) {
  const { user, loading } = useAuthUser();
  const { toast } = useToast();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase
      .from('subject_follows')
      .select('user_id')
      .eq('subject_id', subjectId)
      .then(({ data }) => {
        if (!active || !data) return;
        setCount(data.length);
        if (user) setFollowing(data.some((r) => r.user_id === user.id));
      });

    return () => {
      active = false;
    };
  }, [subjectId, user]);

  if (loading) {
    return <div className="h-10 w-36 animate-pulse rounded-full bg-surface" />;
  }

  if (!user) {
    return (
      <Link href="/auth/login" className="btn-secondary">
        <BellIcon className="h-4 w-4" />
        Seguir materia
      </Link>
    );
  }

  async function toggle() {
    if (busy || !user) return;
    setBusy(true);
    const supabase = createClient();
    const next = !following;
    setFollowing(next);
    setCount((c) => c + (next ? 1 : -1));

    try {
      if (next) {
        await supabase
          .from('subject_follows')
          .insert({ subject_id: subjectId, user_id: user.id });
        toast('Ahora seguís esta materia', 'success');
      } else {
        await supabase
          .from('subject_follows')
          .delete()
          .eq('subject_id', subjectId)
          .eq('user_id', user.id);
        toast('Dejaste de seguir esta materia', 'info');
      }
    } catch {
      setFollowing(!next);
      setCount((c) => c + (next ? -1 : 1));
      toast('No se pudo actualizar', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={following ? 'btn-secondary' : 'btn-primary'}
      title={following ? 'Dejar de seguir' : 'Seguir materia'}
    >
      <BellIcon className="h-4 w-4" />
      {following ? 'Siguiendo' : 'Seguir materia'}
      {count > 0 && (
        <span className="ml-1 rounded-full bg-black/10 px-1.5 text-xs font-semibold dark:bg-white/15">
          {count}
        </span>
      )}
    </button>
  );
}
