import React from 'react';

/**
 * Dashboard Header Logo — Golden Tribrata Polri Emblem (/assets/aistudio/Logo_Tri_Brata__1___1__7bf85ea6.png)
 */
export const QuickWinsEmblem: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  if (!imgFailed) {
    return (
      <img
        src="/assets/aistudio/Logo_Tri_Brata__1___1__7bf85ea6.png"
        alt="Logo Tribrata Polri"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${className} object-contain select-none`}
      />
    );
  }

  return (
    <svg viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M40 4L72 16V43C72 62.5 57.5 76.8 40 84C22.5 76.8 8 62.5 8 43V16L40 4Z"
        fill="#1C150E"
        stroke="#E5B63A"
        strokeWidth="3.5"
      />
      <polygon
        points="40,7 42.2,11.5 47,12.2 43.5,15.6 44.3,20.4 40,18.1 35.7,20.4 36.5,15.6 33,12.2 37.8,11.5"
        fill="#F4C94D"
      />
      <circle cx="40" cy="48" r="17" fill="#F8F3E6" stroke="#D4A017" strokeWidth="2.5" />
      <path d="M18 68H62L57 76H23L18 68Z" fill="#D4A017" />
    </svg>
  );
};

/**
 * Official Tribrata Polri Monochrome Emblem for Surat Perintah Page 1 Header (Image 2)
 * Uses uploaded Tribrata logo (/assets/aistudio/tb__1__e5e5aec3.png) as the default logo.
 */
export const TribrataPrintEmblem: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  if (!imgFailed) {
    return (
      <img
        src="/assets/aistudio/tb__1__e5e5aec3.png"
        alt="Logo Tribrata Polri"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${className} object-contain mix-blend-multiply select-none`}
      />
    );
  }

  return (
    <svg viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <polygon points="60,4 62,10 68,10 63,13.5 65,19 60,15.5 55,19 57,13.5 52,10 58,10" fill="#111" />
      <polygon points="44,12 45.5,16.5 50,16.5 46.5,19 47.8,23.5 44,20.8 40.2,23.5 41.5,19 38,16.5 42.5,16.5" fill="#111" />
      <polygon points="76,12 77.5,16.5 82,16.5 78.5,19 79.8,23.5 76,20.8 72.2,23.5 73.5,19 70,16.5 74.5,16.5" fill="#111" />
      <path
        d="M34 32C24 42 20 58 26 74C32 88 46 95 60 98C74 95 88 88 94 74C100 58 96 42 86 32"
        stroke="#111"
        strokeWidth="2.2"
        fill="none"
      />
      <path
        d="M60 24L83 34V57C83 73 72 84 60 90C48 84 37 73 37 57V34L60 24Z"
        fill="#ffffff"
        stroke="#111"
        strokeWidth="2.2"
      />
      <path d="M60 33C64 38 64 43 60 47C56 43 56 38 60 33Z" fill="#111" />
      <rect x="57.5" y="54" width="5" height="22" fill="#111" />
      <path d="M40 84H80L76 92H44L40 84Z" fill="#ffffff" stroke="#111" strokeWidth="1.6" />
    </svg>
  );
};

/**
 * Default Official Circular Polsek Stamp Graphic matching NEW STAMPLE (2).png
 */
export const DefaultStampGraphic: React.FC<{
  resorText?: string;
  sektorText?: string;
  className?: string;
}> = ({
  resorText = 'POLRI RESOR KOTA BESAR SEMARANG',
  sektorText = 'SEKTOR SEMARANG SELATAN',
  className = 'w-full h-full opacity-90',
}) => {
  const uid = React.useId().replace(/:/g, '');
  const topArcId = `top-arc-${uid}`;
  const bottomArcId = `bottom-arc-${uid}`;
  const innerClipId = `inner-clip-${uid}`;
  const stampColor = '#6A3EC8';

  const renderMiniTribrata = (cx: number, cy: number) => (
    <g transform={`translate(${cx - 13}, ${cy - 13}) scale(0.26)`}>
      {/* 3 Stars */}
      <polygon points="50,6 52,13 59,13 53.5,17 55.5,24 50,19.8 44.5,24 46.5,17 41,13 48,13" fill={stampColor} />
      <polygon points="32,14 33.6,19 39,19 34.8,22 36.2,27 32,24 27.8,27 29.2,22 25,19 30.4,19" fill={stampColor} />
      <polygon points="68,14 69.6,19 75,19 70.8,22 72.2,27 68,24 63.8,27 65.2,22 61,19 66.4,19" fill={stampColor} />
      {/* Outer Padi & Kapas Wreath */}
      <path
        d="M22 34C10 46 8 64 16 78C24 90 36 95 50 96C64 95 76 90 84 78C92 64 90 46 78 34"
        fill="none"
        stroke={stampColor}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Shield */}
      <path
        d="M50 26L72 36V58C72 72 62 82 50 88C38 82 28 72 28 58V36L50 26Z"
        fill={stampColor}
      />
      <path
        d="M50 32L66 39V56C66 67 58 75 50 80C42 75 34 67 34 56V39L50 32Z"
        fill="#ffffff"
      />
      <rect x="46" y="45" width="8" height="26" fill={stampColor} />
      <circle cx="50" cy="40" r="4" fill={stampColor} />
      {/* Bottom Ribbon */}
      <path d="M24 84H76L72 93H28L24 84Z" fill="#ffffff" stroke={stampColor} strokeWidth="3.5" />
    </g>
  );

  return (
    <svg viewBox="0 0 180 180" className={className}>
      <defs>
        <path id={topArcId} d="M 22,90 A 68,68 0 1,1 158,90" />
        <path id={bottomArcId} d="M 20,96 A 70,70 0 0,0 160,96" />
        <clipPath id={innerClipId}>
          <circle cx="90" cy="90" r="54.5" />
        </clipPath>
      </defs>

      {/* Outer Ring + Inner Thin Ring */}
      <circle cx="90" cy="90" r="85" fill="none" stroke={stampColor} strokeWidth="3.2" />
      <circle cx="90" cy="90" r="81" fill="none" stroke={stampColor} strokeWidth="1" />

      {/* Center Circle */}
      <circle cx="90" cy="90" r="55" fill="none" stroke={stampColor} strokeWidth="1.8" />

      {/* Vertical Parallel Stripes (clipped cleanly inside inner circle, top & bottom) */}
      <g clipPath={`url(#${innerClipId})`}>
        {[40, 47, 54, 61, 68, 75, 82, 89, 96, 103, 110, 117, 124, 131, 138].map((x) => (
          <React.Fragment key={x}>
            <line x1={x} y1={34} x2={x} y2={74} stroke={stampColor} strokeWidth="1.4" />
            <line x1={x} y1={106} x2={x} y2={146} stroke={stampColor} strokeWidth="1.4" />
          </React.Fragment>
        ))}
      </g>

      {/* Open Horizontal Band for KEPALA */}
      <rect x="36" y="74" width="108" height="32" fill="#ffffff" />
      <line x1="36" y1="74" x2="144" y2="74" stroke={stampColor} strokeWidth="1.8" />
      <line x1="36" y1="106" x2="144" y2="106" stroke={stampColor} strokeWidth="1.8" />

      <text
        x="91"
        y="97"
        textAnchor="middle"
        fill={stampColor}
        fontSize="19"
        fontWeight="700"
        letterSpacing="5.5"
        fontFamily="Arial, sans-serif"
      >
        KEPALA
      </text>

      {/* Top Curved Text */}
      <text
        fill={stampColor}
        fontSize="10.8"
        fontWeight="600"
        fontFamily="Arial, sans-serif"
        letterSpacing="0.8"
      >
        <textPath href={`#${topArcId}`} startOffset="50%" textAnchor="middle">
          {resorText.toUpperCase()}
        </textPath>
      </text>

      {/* Bottom Curved Text */}
      <text
        fill={stampColor}
        fontSize="10.8"
        fontWeight="600"
        fontFamily="Arial, sans-serif"
        letterSpacing="0.8"
      >
        <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
          {sektorText.toUpperCase()}
        </textPath>
      </text>

      {/* Left & Right Circular Medallions with Mini Tribrata */}
      <circle cx="22" cy="90" r="18" fill="#ffffff" stroke={stampColor} strokeWidth="1.8" />
      {renderMiniTribrata(22, 90)}

      <circle cx="158" cy="90" r="18" fill="#ffffff" stroke={stampColor} strokeWidth="1.8" />
      {renderMiniTribrata(158, 90)}
    </svg>
  );
};

/**
 * Default Signature Graphic matching TTD KOMPOL RISMANTO (4).png
 */
export const DefaultSignatureGraphic: React.FC<{ className?: string }> = ({
  className = 'w-full h-auto',
}) => (
  <svg viewBox="0 0 360 190" className={className}>
    {/* Leftmost tall vertical stroke with top & bottom hooks */}
    <path
      d="M 52,32 L 49,17 C 48,55 44,115 41,160 C 41,165 44,167 46,164"
      fill="none"
      stroke="#0A0A0A"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Left R-loop crossing vertical stroke */}
    <path
      d="M 31,115 C 31,94 64,74 80,77 C 86,79 68,100 47,112 C 62,107 74,108 82,114 C 89,119 95,116 98,111"
      fill="none"
      stroke="#0A0A0A"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Second tall vertical stroke */}
    <path
      d="M 106,44 L 103,35 C 102,75 106,132 111,172"
      fill="none"
      stroke="#0A0A0A"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right cursive cluster & trailing horizontal tail */}
    <path
      d="M 129,108 L 132,81 C 122,87 116,99 120,108 C 125,116 144,118 159,122 C 151,128 140,131 132,131 C 138,125 147,120 155,117"
      fill="none"
      stroke="#0A0A0A"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M 131,92 C 143,86 157,84 167,85 C 169,91 163,98 164,102 C 167,104 171,105 173,108 C 218,104 282,105 340,107"
      fill="none"
      stroke="#0A0A0A"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Official Circular Polsek Stamp + Signature Overlay
 * Supports imported custom PNG/JPG/SVG images or built-in default graphics,
 * sized in physical cm/mm (default stamp 4.7 cm) and positioned relative to the signature block.
 */
export const PolsekStampAndSignature: React.FC<{
  resorText: string;
  sektorText: string;
  config?: {
    stampImageDataUrl: string | null;
    stampSizeCm: number;
    stampOffsetXMm: number;
    stampOffsetYMm: number;
    stampMultiplyBlend: boolean;
    signatureImageDataUrl: string | null;
    signatureWidthCm: number;
    signatureOffsetXMm: number;
    signatureOffsetYMm: number;
    signatureMultiplyBlend: boolean;
    aboveText: boolean;
  };
}> = ({ resorText, sektorText, config }) => {
  const stampSizeCm = config?.stampSizeCm ?? 4.7;
  const stampX = config?.stampOffsetXMm ?? 2;
  const stampY = config?.stampOffsetYMm ?? 2;
  const stampMultiply = config?.stampMultiplyBlend ?? true;

  const sigWidthCm = config?.signatureWidthCm ?? 5.2;
  const sigX = config?.signatureOffsetXMm ?? 18;
  const sigY = config?.signatureOffsetYMm ?? 14;
  const sigMultiply = config?.signatureMultiplyBlend ?? true;

  const zIndexClass = (config?.aboveText ?? true) ? 'z-20' : 'z-0';

  return (
    <div
      className={`pointer-events-none select-none absolute inset-0 overflow-visible ${zIndexClass}`}
    >
      {/* Stamp Layer (Default 4.7 cm = 47mm) */}
      <div
        className="absolute"
        style={{
          left: `${stampX}mm`,
          top: `${stampY}mm`,
          width: `${stampSizeCm}cm`,
          height: `${stampSizeCm}cm`,
          mixBlendMode: stampMultiply ? 'multiply' : 'normal',
        }}
      >
        {config?.stampImageDataUrl ? (
          <img
            src={config.stampImageDataUrl}
            alt="Stempel Kesatuan"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain opacity-90"
          />
        ) : (
          <DefaultStampGraphic resorText={resorText} sektorText={sektorText} />
        )}
      </div>

      {/* Signature Layer (Adjustable Width in cm & X/Y Position in mm) */}
      <div
        className="absolute"
        style={{
          left: `${sigX}mm`,
          top: `${sigY}mm`,
          width: `${sigWidthCm}cm`,
          mixBlendMode: sigMultiply ? 'multiply' : 'normal',
        }}
      >
        {config?.signatureImageDataUrl ? (
          <img
            src={config.signatureImageDataUrl}
            alt="Tanda Tangan Pejabat"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-contain"
          />
        ) : (
          <DefaultSignatureGraphic />
        )}
      </div>
    </div>
  );
};
