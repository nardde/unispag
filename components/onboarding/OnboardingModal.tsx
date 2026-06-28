'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
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

export function OnboardingModal({
  userId,
  initialUniversities = [],
  initialCareers = [],
  onClose,
}: {
  userId: string;
  initialUniversities?: string[];
  initialCareers?: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [unis, setUnis] = useState<Uni[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [selUnis, setSelUnis] = useState<string[]>(initialUniversities);
  const [selCareers, setSelCareers] = useState<string[]>(initialCareers);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('universities')
      .select('id, name, acronym')
      .order('name')
      .then(({ data }) => setUnis((data ?? []) as Uni[]));
    supabase
      .from('careers')
      .select('id, name, university_id')
      .then(({ data }) => setCareers((data ?? []) as Career[]));

    // Pre-fill with the user's existing selections (so re-opening keeps them).
    if (initialUniversities.length === 0 && initialCareers.length === 0) {
      supabase
        .from('user_universities')
        .select('university_id')
        .eq('user_id', userId)
        .then(({ data }) =>
          setSelUnis((data ?? []).map((r: { university_id: string }) => r.university_id))
        );
      supabase
        .from('user_careers')
        .select('career_id')
        .eq('user_id', userId)
        .then(({ data }) =>
          setSelCareers((data ?? []).map((r: { career_id: string }) => r.career_id))
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uniOptions: Option[] = unis.map((u) => ({
    id: u.id,
    label: u.name,
    sublabel: u.acronym ?? undefined,
  }));
  const careerOptions: Option[] = careers
    .filter((c) => selUnis.length === 0 || selUnis.includes(c.university_id))
    .map((c) => {
      const uni = unis.find((u) => u.id === c.university_id);
      return { id: c.id, label: c.name, sublabel: uni?.acronym ?? uni?.name };
    });

  async function finish() {
    setSaving(true);
    const supabase = createClient();
    try {
      await supabase.from('user_universities').delete().eq('user_id', userId);
      await supabase.from('user_careers').delete().eq('user_id', userId);
      if (selUnis.length) {
        await supabase
          .from('user_universities')
          .insert(selUnis.map((id) => ({ user_id: userId, university_id: id })));
      }
      if (selCareers.length) {
        await supabase
          .from('user_careers')
          .insert(selCareers.map((id) => ({ user_id: userId, career_id: id })));
      }
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId);
      onClose();
      router.refresh();
    } catch {
      toast('No se pudo guardar. Intentá de nuevo.', 'error');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg animate-scale-in flex-col overflow-hidden rounded-t-3xl bg-card shadow-apple-lg sm:rounded-3xl">
        {/* progress */}
        <div className="flex gap-1.5 p-4 pb-0">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full ${
                n <= step ? 'bg-brand-500' : 'bg-surface'
              }`}
            />
          ))}
        </div>

        <div className="overflow-y-auto p-6">
          {step === 1 && (
            <div className="py-6 text-center">
              <h2 className="text-2xl font-semibold text-ink">
                Bienvenido a UniPag 👋
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-[15px] text-subtle">
                Te hacemos 3 preguntas rápidas para personalizar tu experiencia.
              </p>
              <button onClick={() => setStep(2)} className="btn-primary mt-6">
                Empezar
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-1 text-xl font-semibold text-ink">
                ¿En qué universidad estudiás?
              </h2>
              <p className="mb-4 text-sm text-subtle">
                Podés elegir más de una.
              </p>
              <SearchMultiSelect
                options={uniOptions}
                selected={selUnis}
                onChange={setSelUnis}
                placeholder="Buscar universidad…"
              />

              <button
                onClick={() => setSuggestOpen((o) => !o)}
                className="mt-3 text-sm font-medium text-brand-500 hover:underline"
              >
                No encuentro mi universidad
              </button>
              {suggestOpen && (
                <input
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Escribí el nombre de tu universidad"
                  className="input mt-2"
                  maxLength={100}
                />
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="text-sm text-subtle hover:text-ink"
                >
                  Saltar por ahora
                </button>
                <button onClick={() => setStep(3)} className="btn-primary">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-1 text-xl font-semibold text-ink">
                ¿Qué carrera cursás?
              </h2>
              <p className="mb-4 text-sm text-subtle">
                {selUnis.length === 0
                  ? 'Elegí una universidad antes para filtrar las carreras, o buscá entre todas.'
                  : 'Filtradas según tu universidad. Podés elegir varias.'}
              </p>
              <SearchMultiSelect
                options={careerOptions}
                selected={selCareers}
                onChange={setSelCareers}
                placeholder="Buscar carrera…"
              />

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setStep(4)}
                  className="text-sm text-subtle hover:text-ink"
                >
                  Saltar por ahora
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="btn-secondary">
                    Atrás
                  </button>
                  <button onClick={() => setStep(4)} className="btn-primary">
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-3xl dark:bg-brand-900/40">
                🎉
              </div>
              <h2 className="text-2xl font-semibold text-ink">¡Todo listo!</h2>
              <p className="mx-auto mt-2 max-w-sm text-[15px] text-subtle">
                Ya personalizamos tu feed. Podés cambiar esto cuando quieras desde
                tu perfil.
              </p>
              <button
                onClick={finish}
                disabled={saving}
                className="btn-primary mt-6"
              >
                {saving ? 'Guardando…' : 'Ir a UniPag'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
