'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  FEEDBACK_LIKES,
  FEEDBACK_IMPROVEMENTS,
  RATING_LABELS,
} from '@/types';

export function FeedbackModal({
  userId,
  email,
  onDone,
}: {
  userId: string;
  email: string | null;
  onDone: () => void;
}) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [likes, setLikes] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [nps, setNps] = useState<number | null>(null);
  const [includeEmail, setIncludeEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Mark as seen so it never shows again (even on dismiss).
  async function markSeen() {
    await createClient()
      .from('profiles')
      .update({ feedback_given: true })
      .eq('id', userId);
  }

  function dismiss() {
    markSeen();
    onDone();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(list: string[], set: (v: string[]) => void, v: string) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function submit() {
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('feedback').insert({
      user_id: userId,
      rating: rating || null,
      liked: likes.length ? likes : null,
      improvements: improvements.length ? improvements : null,
      improvements_other: improvements.includes('Otro')
        ? otherText.trim() || null
        : null,
      nps_score: nps,
      contact_email: includeEmail ? email : null,
    });
    await markSeen();
    setDone(true);
    setTimeout(onDone, 2000);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md animate-scale-in overflow-hidden rounded-t-3xl bg-card shadow-apple-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="px-6 py-12 text-center">
            <div className="mb-3 text-4xl">🙌</div>
            <p className="text-lg font-semibold text-ink">
              ¡Gracias! Tu opinión nos ayuda a mejorar
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-hairline/60 p-4">
              <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
                <span>⭐</span> ¿Qué te parece UniPag?
              </h2>
              <button
                onClick={dismiss}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-subtle hover:bg-hairline/60"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {step === 1 && (
                <div className="text-center">
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onMouseEnter={() => setHover(s)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(s)}
                        className="text-4xl transition-transform hover:scale-110"
                        aria-label={`${s} estrellas`}
                      >
                        <span
                          className={
                            (hover || rating) >= s
                              ? 'text-amber-400'
                              : 'text-hairline'
                          }
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 h-5 text-sm font-medium text-subtle">
                    {RATING_LABELS[hover || rating] ?? ''}
                  </p>
                </div>
              )}

              {step === 2 && (
                <Pills
                  title="¿Qué es lo que más te gusta?"
                  options={[...FEEDBACK_LIKES]}
                  selected={likes}
                  onToggle={(v) => toggle(likes, setLikes, v)}
                />
              )}

              {step === 3 && (
                <div>
                  <Pills
                    title="¿Qué podríamos mejorar?"
                    options={[...FEEDBACK_IMPROVEMENTS]}
                    selected={improvements}
                    onToggle={(v) => toggle(improvements, setImprovements, v)}
                  />
                  {improvements.includes('Otro') && (
                    <textarea
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Contanos qué mejorarías"
                      className="input mt-3 min-h-[64px] resize-y"
                      maxLength={300}
                    />
                  )}
                </div>
              )}

              {step === 4 && (
                <div>
                  <p className="mb-4 text-center text-[15px] font-medium text-ink">
                    ¿Recomendarías UniPag a un compañero?
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                      <button
                        key={n}
                        onClick={() => setNps(n)}
                        className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                          nps === n
                            ? 'bg-brand-500 text-white'
                            : 'bg-surface text-ink hover:bg-hairline/60'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between px-1 text-xs text-subtle">
                    <span>Para nada</span>
                    <span>Definitivamente</span>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <p className="text-[15px] font-medium text-ink">
                    ¿Querés dejarnos tu email para que te contactemos?
                  </p>
                  <label className="mt-3 flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={includeEmail}
                      onChange={(e) => setIncludeEmail(e.target.checked)}
                    />
                    Incluir mi email{email ? ` (${email})` : ''}
                  </label>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="btn-ghost"
                  >
                    Atrás
                  </button>
                ) : (
                  <span />
                )}
                {step < 5 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={step === 1 && rating === 0}
                    className="btn-primary"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Enviando…' : 'Enviar opinión'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Pills({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[15px] font-medium text-ink">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              selected.includes(o)
                ? 'bg-brand-500 text-white'
                : 'bg-surface text-ink hover:bg-hairline/60'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
