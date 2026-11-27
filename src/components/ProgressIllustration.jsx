// Явцын зохиомол дүрслэл: барилгын давхрууд хувиар дүүрнэ. Бодит зураг биш.
export default function ProgressIllustration({ percent, floors = 12 }) {
  const done = Math.round((percent / 100) * floors);
  const h = 8;
  return (
    <svg className="progress-art" viewBox="0 0 120 120" role="img" aria-hidden="true">
      <rect className="art-ground" x="0" y="108" width="120" height="12" />
      {Array.from({ length: floors }, (_, i) => (
        <rect
          key={i}
          className={i < done ? 'art-floor done' : 'art-floor'}
          x="30"
          y={108 - (i + 1) * h}
          width="60"
          height={h - 1}
          rx="1"
        />
      ))}
      <line className="art-crane" x1="100" y1="108" x2="100" y2="6" />
      <line className="art-crane" x1="70" y1="10" x2="116" y2="10" />
    </svg>
  );
}
