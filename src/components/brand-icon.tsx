'use client';

export default function BrandIcon({
  size = 26,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.svg"
        alt="PixelFandom"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    </span>
  );
}
