'use client';

import { useEffect, useState } from 'react';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

/**
 * Renders the "Personalizar" button and the onboarding overlay.
 * Auto-opens once when `autoOpen` is true (first login).
 */
export function Onboarding({
  userId,
  autoOpen = false,
  initialUniversities = [],
  initialCareers = [],
  showButton = true,
}: {
  userId: string;
  autoOpen?: boolean;
  initialUniversities?: string[];
  initialCareers?: string[];
  showButton?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  return (
    <>
      {showButton && (
        <button onClick={() => setOpen(true)} className="btn-secondary">
          Personalizar
        </button>
      )}
      {open && (
        <OnboardingModal
          userId={userId}
          initialUniversities={initialUniversities}
          initialCareers={initialCareers}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
