import nomayaLogo from "@/assets/Nomaya copy.png";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={nomayaLogo}
      alt="Nomaya"
      className={className ?? "h-28 w-28 mx-auto mb-4 rounded-2xl object-contain"}
    />
  );
}
