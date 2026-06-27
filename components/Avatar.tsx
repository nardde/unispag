import { avatarGradient } from '@/lib/avatarColor';

/** Circular avatar: shows the uploaded photo, or initials on a consistent
 *  gradient derived from the username. */
export function Avatar({
  username,
  avatarUrl,
  size = 40,
  className = '',
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (username?.[0] ?? '?').toUpperCase();
  const [from, to] = avatarGradient(username || '?');

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={username}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
