// BotRights.ai Logo - Institutional Scale of Justice
// Designed for AI rights advocacy platform

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
}

export function Logo({ size = 36, className = '', variant = 'default' }: LogoProps) {
  const bgColor = variant === 'light' ? '#D4A855' : '#1a2744';
  const fgColor = variant === 'light' ? '#1a2744' : '#D4A855';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BotRights.ai Logo"
    >
      {/* Background */}
      <rect width="48" height="48" rx="4" fill={bgColor} />

      {/* Scale of Justice */}
      <g fill={fgColor}>
        {/* Central pillar */}
        <rect x="22" y="14" width="4" height="22" />

        {/* Top crossbeam */}
        <rect x="8" y="10" width="32" height="3" rx="1.5" />

        {/* Left scale pan - hanging chains */}
        <rect x="10" y="13" width="1.5" height="8" />
        <rect x="16" y="13" width="1.5" height="8" />

        {/* Left pan (bowl shape) */}
        <path d="M7 21 C7 21, 7 25, 14 25 C21 25, 21 21, 21 21 L19 21 C19 21, 19 23, 14 23 C9 23, 9 21, 9 21 Z" />

        {/* Right scale pan - hanging chains */}
        <rect x="30.5" y="13" width="1.5" height="8" />
        <rect x="36.5" y="13" width="1.5" height="8" />

        {/* Right pan (bowl shape) */}
        <path d="M27 21 C27 21, 27 25, 34 25 C41 25, 41 21, 41 21 L39 21 C39 21, 39 23, 34 23 C29 23, 29 21, 29 21 Z" />

        {/* Base pedestal */}
        <path d="M16 36 L32 36 L30 38 L18 38 Z" />
        <rect x="20" y="38" width="8" height="2" />
      </g>

      {/* Circuit node accents - representing AI/technology */}
      <g fill={fgColor} opacity="0.6">
        <circle cx="6" cy="6" r="2" />
        <circle cx="42" cy="6" r="2" />
        <circle cx="6" cy="42" r="2" />
        <circle cx="42" cy="42" r="2" />
      </g>
    </svg>
  );
}

// Simplified mark for smaller sizes (favicons, etc.)
export function LogoMark({ size = 32, className = '', variant = 'default' }: LogoProps) {
  const bgColor = variant === 'light' ? '#D4A855' : '#1a2744';
  const fgColor = variant === 'light' ? '#1a2744' : '#D4A855';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BotRights.ai"
    >
      {/* Background */}
      <rect width="32" height="32" rx="3" fill={bgColor} />

      {/* Simplified scale symbol */}
      <g fill={fgColor}>
        {/* Pillar */}
        <rect x="14.5" y="9" width="3" height="15" />

        {/* Beam */}
        <rect x="5" y="6" width="22" height="2.5" rx="1.25" />

        {/* Left pan indicator */}
        <circle cx="8" cy="14" r="3" />

        {/* Right pan indicator */}
        <circle cx="24" cy="14" r="3" />

        {/* Base */}
        <rect x="10" y="24" width="12" height="2" rx="1" />
      </g>
    </svg>
  );
}

// Wordmark text component
export function LogoText({ className = '' }: { className?: string }) {
  return (
    <span
      className={`text-lg font-semibold text-navy-900 tracking-tight ${className}`}
      style={{ fontFamily: 'var(--font-serif)' }}
    >
      BotRights.ai
    </span>
  );
}

// Combined logo with text
export function LogoWithText({
  size = 36,
  className = '',
  showText = true
}: LogoProps & { showText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={size} />
      {showText && (
        <span
          className="text-lg font-semibold text-navy-900 tracking-tight hidden sm:block"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          BotRights.ai
        </span>
      )}
    </div>
  );
}
