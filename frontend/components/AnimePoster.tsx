'use client';
import { useState } from 'react';

interface Props {
  src: string;
  title: string;
  className?: string;
  style?: React.CSSProperties;
}

function titleHue(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffff;
  return h % 360;
}

/** Displays anime poster. Falls back to a styled gradient with initials if image is missing/broken. */
export default function AnimePoster({ src, title, className = '', style }: Props) {
  const [failed, setFailed] = useState(false);
  const hue = titleHue(title);
  const initials = title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '??';

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 p-2 ${className}`}
        style={{
          background: `linear-gradient(135deg, hsl(${hue},50%,18%) 0%, hsl(${(hue + 40) % 360},45%,10%) 100%)`,
          ...style,
        }}
      >
        <div
          className="rounded-xl flex items-center justify-center font-black text-white/80"
          style={{
            width: '40%',
            aspectRatio: '1',
            background: `hsl(${hue},55%,28%)`,
            fontSize: 'clamp(14px, 5cqi, 28px)',
          }}
        >
          {initials}
        </div>
        <p className="text-[9px] text-white/50 text-center font-mono line-clamp-3 leading-tight px-1">{title}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className={`object-cover ${className}`}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
