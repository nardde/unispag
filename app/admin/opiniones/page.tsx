import { createServerClient } from '@/lib/supabase-server';
import { FeedbackPanel, type AdminFeedback } from '@/components/admin/FeedbackPanel';

export const dynamic = 'force-dynamic';

export default async function AdminOpiniones() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('feedback')
    .select(
      'id, rating, liked, improvements, improvements_other, nps_score, contact_email, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(1000);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink">Opiniones</h2>
      <FeedbackPanel rows={(data ?? []) as AdminFeedback[]} />
    </div>
  );
}
