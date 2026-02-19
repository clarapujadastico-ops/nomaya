import { useState } from "react";
import { Shield, Camera, SkipForward } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useUpdateProfile } from "@/hooks/useProfile";

type VerifyStep = "verify_intro" | "verify_id" | "verify_selfie";

interface VerificationFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function VerificationFlow({ onComplete, onSkip }: VerificationFlowProps) {
  const [step, setStep] = useState<VerifyStep>("verify_intro");
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const { mutate: updateProfile } = useUpdateProfile();

  /* ── VERIFY INTRO ── */
  if (step === "verify_intro") {
    return (
      <div className="mobile-container flex flex-col bg-background px-6 pt-14 pb-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Step 3 of 3</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}
          >
            Verify you're a woman
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Nomaya is a women-only space. We verify members to keep the community safe.
          </p>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-foreground" />
              </div>
              <div>
                <h3 className="font-serif text-base font-medium text-foreground">We'll ask for</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Two quick photos — takes under a minute</p>
              </div>
            </div>
            <div className="space-y-2.5 mt-3">
              {[
                { icon: "🪪", label: "A photo of your ID", note: "Passport, DNI, or driver's licence" },
                { icon: "🤳", label: "A selfie", note: "So we can match your face to your ID" },
              ].map(({ icon, label, note }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-t border-border">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🔒 Your photos are used only for verification and are deleted after review. We never store your ID long-term.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => setStep("verify_id")}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 gradient-cta text-white"
          >
            <Camera size={16} />
            Start verification
          </button>
          <button
            onClick={() => {
              updateProfile({ verification_status: "unverified" }, { onSuccess: onSkip, onError: onSkip });
            }}
            className="w-full py-3 text-muted-foreground text-sm flex items-center justify-center gap-1"
          >
            <SkipForward size={14} />
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  /* ── VERIFY ID SCAN ── */
  if (step === "verify_id") {
    async function captureId() {
      try {
        const photo = await CapCamera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          quality: 80,
        });
        setIdPhotoPreview(photo.dataUrl ?? null);
      } catch {
        // user cancelled
      }
    }

    return (
      <div className="mobile-container flex flex-col bg-background pb-10" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-14 pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">ID verification · 1/2</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "1.75rem", letterSpacing: "-0.042em" }}
          >
            Scan your ID
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Passport, DNI, or driver's licence.
          </p>
        </div>

        <div className="mx-6 rounded-2xl overflow-hidden relative bg-muted flex-1" style={{ minHeight: 260 }}>
          {idPhotoPreview ? (
            <img src={idPhotoPreview} alt="ID preview" className="w-full h-full object-cover" style={{ minHeight: 260 }} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center" style={{ minHeight: 260 }}>
              {["top-3 left-3 border-t-2 border-l-2 rounded-tl-lg",
                "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg",
                "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg",
                "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg",
              ].map((cls, i) => (
                <div key={i} className={`absolute ${cls} w-8 h-8 border-white/70`} />
              ))}
              <p className="text-xs text-muted-foreground">Tap to scan ID</p>
            </div>
          )}
        </div>

        <div className="px-6 mt-5 space-y-3">
          {idPhotoPreview ? (
            <>
              <button
                onClick={() => setStep("verify_selfie")}
                className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] gradient-cta text-white"
              >
                Looks good → Continue
              </button>
              <button onClick={() => setIdPhotoPreview(null)} className="w-full py-2 text-muted-foreground text-sm">
                Retake photo
              </button>
            </>
          ) : (
            <button
              onClick={captureId}
              className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 gradient-cta text-white"
            >
              <Camera size={16} />
              Take photo
            </button>
          )}
          <button onClick={() => setStep("verify_intro")} className="w-full py-2 text-muted-foreground text-sm">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  /* ── VERIFY SELFIE ── */
  if (step === "verify_selfie") {
    async function captureSelfie() {
      try {
        const photo = await CapCamera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          quality: 80,
        });
        setSelfiePreview(photo.dataUrl ?? null);
      } catch {
        // user cancelled
      }
    }

    function finishVerification() {
      updateProfile(
        { verification_status: "pending" },
        { onSuccess: onComplete, onError: onComplete }
      );
    }

    return (
      <div className="mobile-container flex flex-col bg-background pb-10" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-14 pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">ID verification · 2/2</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "1.75rem", letterSpacing: "-0.042em" }}
          >
            Take a selfie
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Look at the camera and take a clear photo of your face.
          </p>
        </div>

        <div className="mx-auto mt-4 rounded-full overflow-hidden relative bg-muted" style={{ width: 220, height: 220 }}>
          {selfiePreview ? (
            <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-4xl">🤳</span>
              <p className="text-xs text-muted-foreground mt-2">Tap to take selfie</p>
            </div>
          )}
        </div>

        <div className="px-6 mt-8 space-y-3">
          {selfiePreview ? (
            <>
              <button
                onClick={finishVerification}
                className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] gradient-cta text-white"
              >
                Submit for review ✦
              </button>
              <button onClick={() => setSelfiePreview(null)} className="w-full py-2 text-muted-foreground text-sm">
                Retake photo
              </button>
            </>
          ) : (
            <button
              onClick={captureSelfie}
              className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 gradient-cta text-white"
            >
              <Camera size={16} />
              Take selfie
            </button>
          )}
          <button onClick={() => setStep("verify_id")} className="w-full py-2 text-muted-foreground text-sm">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
