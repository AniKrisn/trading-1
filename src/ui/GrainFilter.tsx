export function GrainFilter() {
  return (
    <svg className="grain-filter" aria-hidden="true">
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="1.8"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </svg>
  );
}
