interface MoonPhaseProps {
  phase: number;
  size?: number;
}

export function MoonPhase({ phase, size = 48 }: MoonPhaseProps) {
  const normalizedPhase = phase % 1;
  const illumination = Math.abs(Math.cos(normalizedPhase * 2 * Math.PI));
  const isWaxing = normalizedPhase < 0.5;
  
  return (
    <div 
      className="relative inline-block"
      style={{ width: size, height: size }}
      data-testid="moon-phase"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="drop-shadow-lg"
      >
        <defs>
          <radialGradient id="moonGradient" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#fffacd" />
            <stop offset="50%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#daa520" />
          </radialGradient>
          <radialGradient id="shadowGradient">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0a0a14" />
          </radialGradient>
          <clipPath id="moonClip">
            <circle cx="50" cy="50" r="45" />
          </clipPath>
        </defs>
        
        <circle cx="50" cy="50" r="45" fill="url(#moonGradient)" />
        
        <circle
          cx="30"
          cy="35"
          r="8"
          fill="rgba(0,0,0,0.1)"
          style={{ filter: 'blur(2px)' }}
        />
        <circle
          cx="60"
          cy="45"
          r="6"
          fill="rgba(0,0,0,0.08)"
          style={{ filter: 'blur(1px)' }}
        />
        <circle
          cx="45"
          cy="65"
          r="10"
          fill="rgba(0,0,0,0.1)"
          style={{ filter: 'blur(2px)' }}
        />
        
        <ellipse
          cx={isWaxing ? 50 - (1 - illumination) * 45 : 50 + (1 - illumination) * 45}
          cy="50"
          rx={45 * (1 - illumination)}
          ry="45"
          fill="url(#shadowGradient)"
          clipPath="url(#moonClip)"
        />
        
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255,215,0,0.3)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
