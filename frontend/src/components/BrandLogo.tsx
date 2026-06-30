import Link from 'next/link';

interface BrandLogoProps {
  showText?: boolean;
  size?: 'sm' | 'md';
  href?: string | null;
  className?: string;
}

const SIZES = {
  sm: { px: 24, text: 'text-sm font-semibold text-white/70' },
  md: { px: 32, text: 'text-lg font-bold text-white' },
} as const;

export default function BrandLogo({
  showText = true,
  size = 'md',
  href = '/',
  className = '',
}: BrandLogoProps) {
  const { px, text } = SIZES[size];

  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.gif"
        alt="Onion Farms"
        width={px}
        height={px}
        className="flex-none object-contain"
        style={{ width: px, height: px }}
      />
      {showText && <span className={text}>Onion Farms</span>}
    </>
  );

  const classes = `inline-flex items-center gap-2 ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
