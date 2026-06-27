'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import type { UserRole } from '@/types';

export interface AdminUser {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
  fileCount: number;
}

export function UsersTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleRole(u: AdminUser) {
    const next: UserRole = u.role === 'admin' ? 'user' : 'admin';
    setBusy(u.id);
    const { error } = await createClient()
      .from('profiles')
      .update({ role: next })
      .eq('id', u.id);
    setBusy(null);
    if (error) return toast('No se pudo cambiar el rol', 'error');
    setUsers((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, role: next } : x))
    );
    toast(`@${u.username} ahora es ${next === 'admin' ? 'admin' : 'usuario'}`, 'success');
  }

  async function remove(u: AdminUser) {
    if (
      !confirm(
        `¿Eliminar a @${u.username}? Se borrarán también sus archivos. No se puede deshacer.`
      )
    )
      return;
    setBusy(u.id);
    const { error } = await createClient().from('profiles').delete().eq('id', u.id);
    setBusy(null);
    if (error) return toast('No se pudo eliminar el usuario', 'error');
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    toast('Usuario eliminado', 'success');
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-hairline/60 text-xs uppercase text-subtle">
          <tr>
            <th className="p-3">Usuario</th>
            <th className="p-3">Se unió</th>
            <th className="p-3">Archivos</th>
            <th className="p-3">Rol</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline/40">
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id}>
                <td className="p-3">
                  <Link
                    href={`/profile/${u.username}`}
                    className="font-medium text-ink hover:underline"
                  >
                    @{u.username}
                  </Link>
                  {isSelf && <span className="ml-1 text-xs text-subtle">(vos)</span>}
                </td>
                <td className="p-3 text-subtle">{formatDate(u.created_at)}</td>
                <td className="p-3 tabular-nums text-subtle">{u.fileCount}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      u.role === 'admin'
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                        : 'bg-surface text-subtle'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={busy === u.id || isSelf}
                      className="font-medium text-brand-600 hover:underline disabled:opacity-40"
                    >
                      {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                    <button
                      onClick={() => remove(u)}
                      disabled={busy === u.id || isSelf}
                      className="font-medium text-rose-600 hover:underline disabled:opacity-40"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
