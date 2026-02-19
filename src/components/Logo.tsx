import nomayaLogo from "@/assets/Nomaya copy.png";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src={nomayaLogo}
      alt="Nomaya"
      className={className ?? "h-14 w-14 mx-auto mb-3 rounded-xl object-contain"}
    />
  );
}
