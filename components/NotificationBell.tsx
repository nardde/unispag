'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuthUser } from '@/lib/useAuthUser';
import { BellIcon } from '@/components/icons';
import { timeAgo } from '@/lib/utils';
import type { Notification } from '@/types';

export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuthUser();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await createClient()
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setItems((data ?? []) as Notification[]);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    if (!user) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await createClient()
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  }

  async function openNotification(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      await createClient()
        .from('notifications')
        .update({ read: true })
        .eq('id', n.id);
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void load();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/80 transition-colors hover:bg-surface"
        aria-label="Notificaciones"
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-canvas" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 origin-top-right animate-scale-in overflow-hidden rounded-2xl bg-card shadow-apple-lg ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
            <div className="flex items-center justify-between border-b border-hairline/60 px-4 py-3">
              <span className="text-sm font-semibold text-ink">Notificaciones</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium text-brand-500 hover:underline"
                >
                  Marcar todo como leído
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-subtle">
                  No tenés notificaciones.
                </p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-hairline/40 px-4 py-3 text-left last:border-0 hover:bg-surface ${
                      n.read ? '' : 'bg-brand-50/50 dark:bg-brand-950/20'
                    }`}
                  >
                    <span className="text-sm text-ink">{n.message}</span>
                    <span className="text-xs text-subtle">
                      {timeAgo(n.created_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
