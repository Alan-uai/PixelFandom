'use client';

import { Dithering } from '@paper-design/shaders-react';

type Props = {
  colorBack?: string;
  colorFront?: string;
};

export default function WikiTypingShader({
  colorBack = '#000000',
  colorFront = '#00b3ff',
}: Props) {
  return (
    <div
      className="relative h-10 w-40 overflow-hidden rounded-md"
      style={{ backgroundColor: colorBack }}
    >
      <Dithering
        width={160}
        height={40}
        colorBack={colorBack}
        colorFront={colorFront}
        shape="sphere"
        type="4x4"
        size={2}
        speed={1}
        scale={0.6}
        className="h-full w-full"
      />
    </div>
  );
}
