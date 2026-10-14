/* eslint-disable @next/next/no-img-element -- a small remote profile photo; next/image would need every Google photo host allowed */

/** The candidate's Google photo, or their initial on a brand-coloured circle. */
export function Avatar({ name, url, size = 32 }: { name: string; url: string | null; size?: number }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  if (url && /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\//.test(url)) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-2 font-semibold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initial}
    </span>
  );
}
