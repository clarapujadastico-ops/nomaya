import nomayaLogo from "@/assets/Nomaya copy.png";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={nomayaLogo}
      alt="Nomaya"
      className={className ?? "h-28 w-auto max-w-[220px] mx-auto mb-2 object-contain"}
    />
  );
}
