'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { useToast } from '@/components/Toast';

export function SuggestionUpvote({
  suggestionId,
  initialCount,
  initialVoted,
}: {
  suggestionId: string;
  initialCount: number;
  initialVoted: boolean;
}) {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) {
      toast('Iniciá sesión para votar', 'info');
      return;
    }
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    const next = !voted;
    setVoted(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      if (next) {
        await supabase
          .from('suggestion_upvotes')
          .insert({ suggestion_id: suggestionId, user_id: user.id });
      } else {
        await supabase
          .from('suggestion_upvotes')
          .delete()
          .eq('suggestion_id', suggestionId)
          .eq('user_id', user.id);
      }
    } catch {
      setVoted(!next);
      setCount((c) => c + (next ? -1 : 1));
      toast('No se pudo registrar tu voto', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors ${
        voted
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
          : 'border-hairline text-subtle hover:border-brand-300 hover:text-ink'
      }`}
      aria-pressed={voted}
      title={voted ? 'Quitar voto' : 'Votar'}
    >
      <span aria-hidden>▲</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
