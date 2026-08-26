import nomayaLogo from "@/assets/nomaya-logo.png";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={nomayaLogo}
      alt="Nomaya"
      className={className ?? "h-20 w-auto max-w-[160px] mx-auto mb-2 object-contain"}
    />
  );
}
