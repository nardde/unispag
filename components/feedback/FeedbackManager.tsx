'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { getDownloads, getUploads, onEngagement } from '@/lib/engagement';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';

export function FeedbackManager() {
  const { user } = useAuthUser();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const checked = useRef(false);
  const eligible = useRef(false);
  const info = useRef({ visits: 0, createdAt: '' });

  const evaluate = useCallback(() => {
    if (!user || !eligible.current || show) return;
    const dl = getDownloads(user.id);
    const up = getUploads(user.id);
    const days =
      (Date.now() - new Date(info.current.createdAt).getTime()) / 86_400_000;
    if (up >= 1 || dl >= 3 || (days >= 7 && info.current.visits >= 3)) {
      setShow(true);
    }
  }, [user, show]);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('feedback_given, visit_count, first_visit_at, created_at')
        .eq('id', user.id)
        .maybeSingle();
      if (!data || data.feedback_given) return;

      setEmail(user.email ?? null);
      let visits = data.visit_count ?? 0;
      const sessKey = `uf:visit:${user.id}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(sessKey)) {
        sessionStorage.setItem(sessKey, '1');
        visits += 1;
        await supabase
          .from('profiles')
          .update({
            visit_count: visits,
            first_visit_at: data.first_visit_at ?? new Date().toISOString(),
          })
          .eq('id', user.id);
      }
      info.current = { visits, createdAt: data.created_at };
      eligible.current = true;
      evaluate();
    })();
  }, [user, evaluate]);

  useEffect(() => onEngagement(evaluate), [evaluate]);

  if (!show || !user) return null;
  return (
    <FeedbackModal
      userId={user.id}
      email={email}
      onDone={() => {
        eligible.current = false;
        setShow(false);
      }}
    />
  );
}
