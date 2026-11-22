interface PolriCrestSvgProps {
  className?: string;
}

export function PolriCrestSvg({ className = 'w-16 h-16' }: PolriCrestSvgProps) {
  return (
    <img
      src="/pwa-512x512.png"
      alt="Logo Setum Polri"
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
}
