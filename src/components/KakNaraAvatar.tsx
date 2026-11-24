import React, { useId } from 'react';

interface KakNaraAvatarProps {
  size: number;
}

export function KakNaraAvatar({ size }: KakNaraAvatarProps) {
  const gradId = useId();
  const radius = size > 60 ? 16 : 14;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00796f" />
          <stop offset="1" stopColor="#0390b5" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx={radius} fill={`url(#${gradId})`} />
      <g stroke="#fff" strokeWidth="3" strokeLinecap="round">
        <path d="M12 21v6M18 16v16M24 11v26M30 17v14M36 21v6" />
      </g>
    </svg>
  );
}

/**
 * Safely renders inline <b>...</b> markers in study prompts without raw HTML injection.
 */
export function RichPromptText({ text }: { text: string }) {
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('<b>') && part.endsWith('</b>')) {
          return (
            <strong key={idx} className="font-bold">
              {part.slice(3, -4)}
            </strong>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
}
