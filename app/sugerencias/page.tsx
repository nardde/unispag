import { createServerClient } from '@/lib/supabase-server';
import { getCurrentProfile } from '@/lib/auth';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Avatar } from '@/components/Avatar';
import { SuggestionForm } from '@/components/suggestions/SuggestionForm';
import { SuggestionUpvote } from '@/components/suggestions/SuggestionUpvote';
import { SetupNotice } from '@/components/SetupNotice';
import { formatDate } from '@/lib/utils';
import {
  SUGGESTION_TYPE_STYLES,
  SUGGESTION_STATUS_LABELS,
  type Suggestion,
  type SuggestionStatus,
} from '@/types';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<SuggestionStatus, string> = {
  pending: 'bg-surface text-subtle',
  approved: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  planned: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  rejected: 'bg-surface text-subtle',
};

export default async function SugerenciasPage() {
  let supabase;
  try {
    supabase = createServerClient();
  } catch {
    return (
      <div className="container-page">
        <SetupNotice />
      </div>
    );
  }

  const { userId, email } = await getCurrentProfile();

  const { data: sugs } = await supabase
    .from('suggestions')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(100);

  const suggestions = (sugs ?? []) as Suggestion[];
  const ids = suggestions.map((s) => s.id);

  const counts = new Map<string, number>();
  const myVotes = new Set<string>();
  if (ids.length) {
    const { data: votes } = await supabase
      .from('suggestion_upvotes')
      .select('suggestion_id, user_id')
      .in('suggestion_id', ids);
    (votes ?? []).forEach((v: { suggestion_id: string; user_id: string }) => {
      counts.set(v.suggestion_id, (counts.get(v.suggestion_id) ?? 0) + 1);
      if (userId && v.user_id === userId) myVotes.add(v.suggestion_id);
    });
  }

  const ordered = [...suggestions].sort(
    (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)
  );

  return (
    <div className="container-page max-w-3xl">
      <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Sugerencias' }]} />

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Sugerencias y mejoras
        </h1>
        <p className="mt-2 text-subtle">
          ¿Tenés una idea para mejorar UniPag? Nos encantaría escucharte.
        </p>
      </header>

      <SuggestionForm defaultEmail={email} />

      <h2 className="mb-4 mt-12 text-sm font-semibold uppercase tracking-wide text-subtle">
        Ideas de la comunidad
      </h2>

      {ordered.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-subtle">
          Todavía no hay sugerencias publicadas. ¡Sé el primero!
        </div>
      ) : (
        <div className="space-y-3">
          {ordered.map((s) => (
            <div key={s.id} className="card flex gap-4 p-5">
              <SuggestionUpvote
                suggestionId={s.id}
                initialCount={counts.get(s.id) ?? 0}
                initialVoted={myVotes.has(s.id)}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      SUGGESTION_TYPE_STYLES[s.type] ?? SUGGESTION_TYPE_STYLES.Otro
                    }`}
                  >
                    {s.type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[s.status]}`}
                  >
                    {SUGGESTION_STATUS_LABELS[s.status]}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-subtle">
                  {s.description}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-subtle">
                  <Avatar
                    username={s.profiles?.username ?? '?'}
                    avatarUrl={s.profiles?.avatar_url}
                    size={20}
                  />
                  <span>
                    {s.profiles?.username ? `@${s.profiles.username}` : 'Anónimo'} ·{' '}
                    {formatDate(s.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
