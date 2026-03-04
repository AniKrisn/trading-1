export function GrainFilter() {
  return (
    <svg className="grain-filter" aria-hidden="true">
      <filter id="ink-rough-line" x="-2%" y="-40%" width="104%" height="180%">
        <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" seed={17} result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
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
