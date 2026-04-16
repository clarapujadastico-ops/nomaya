import { useState } from "react";
import { Shield, Camera, SkipForward } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useLang } from "@/contexts/LanguageContext";

type VerifyStep = "verify_intro" | "verify_id" | "verify_selfie";

interface VerificationFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

async function uploadVerificationPhoto(
  base64: string,
  path: string
): Promise<void> {
  const chars = atob(base64);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
  const blob = new Blob([bytes], { type: "image/jpeg" });
  const { error } = await supabase.storage
    .from("Verification")
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (error) throw error;
}

export function VerificationFlow({ onComplete, onSkip }: VerificationFlowProps) {
  const [step, setStep] = useState<VerifyStep>("verify_intro");
  const [idPhotoBase64, setIdPhotoBase64] = useState<string | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { user } = useAuth();
  const { mutate: updateProfile } = useUpdateProfile();
  const { t } = useLang();

  /* ── VERIFY INTRO ── */
  if (step === "verify_intro") {
    return (
      <div className="mobile-container flex flex-col bg-background px-6 pt-14 pb-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("verify.step_3")}</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}
          >
            {t("verify.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">{t("verify.subtitle")}</p>
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-card rounded-2xl p-4 shadow-soft">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-foreground" />
              </div>
              <div>
                <h3 className="font-serif text-base font-medium text-foreground">{t("verify.ask_for")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("verify.two_photos")}</p>
              </div>
            </div>
            <div className="space-y-2.5 mt-3">
              {[
                { icon: "🪪", label: t("verify.id_label"), note: t("verify.id_note") },
                { icon: "🤳", label: t("verify.selfie_label"), note: t("verify.selfie_note") },
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

          <div className="bg-card rounded-2xl p-4 shadow-soft space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">{t("verify.privacy_1")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("verify.privacy_2")}</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => setStep("verify_id")}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 gradient-cta text-white"
          >
            <Camera size={16} />
            {t("verify.start")}
          </button>
          <button
            onClick={() => {
              updateProfile({ verification_status: "unverified" }, { onSuccess: onSkip, onError: onSkip });
            }}
            className="w-full py-3 text-muted-foreground text-sm flex items-center justify-center gap-1"
          >
            <SkipForward size={14} />
            {t("verify.skip")}
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
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
          quality: 80,
        });
        if (!photo.base64String) return;
        setIdPhotoBase64(photo.base64String);
        setIdPhotoPreview(`data:image/jpeg;base64,${photo.base64String}`);
      } catch {
        // user cancelled
      }
    }

    return (
      <div className="mobile-container flex flex-col bg-background pb-10" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-14 pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("verify.id_step")}</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "1.75rem", letterSpacing: "-0.042em" }}
          >
            {t("verify.scan_title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("verify.scan_sub")}</p>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t("verify.gender_note")}</p>
        </div>

        <div className="mx-6 rounded-2xl overflow-hidden relative bg-muted flex-1" style={{ minHeight: 260 }}>
          {idPhotoPreview ? (
            <img src={idPhotoPreview} alt="ID preview" className="w-full h-full object-cover" style={{ minHeight: 260 }} />
          ) : (
            <button
              onClick={captureId}
              className="w-full h-full flex flex-col items-center justify-center"
              style={{ minHeight: 260 }}
            >
              {["top-3 left-3 border-t-2 border-l-2 rounded-tl-lg",
                "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg",
                "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg",
                "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg",
              ].map((cls, i) => (
                <div key={i} className={`absolute ${cls} w-8 h-8 border-white/70`} />
              ))}
              <p className="text-xs text-muted-foreground">{t("verify.tap_id")}</p>
            </button>
          )}
        </div>

        <div className="px-6 mt-5 space-y-3">
          {idPhotoPreview ? (
            <>
              <button
                onClick={() => setStep("verify_selfie")}
                className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] gradient-cta text-white"
              >
                {t("verify.looks_good")}
              </button>
              <button
                onClick={() => { setIdPhotoBase64(null); setIdPhotoPreview(null); }}
                className="w-full py-2 text-muted-foreground text-sm"
              >
                {t("verify.retake")}
              </button>
            </>
          ) : (
            <button
              onClick={captureId}
              className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 gradient-cta text-white"
            >
              <Camera size={16} />
              {t("verify.take_photo")}
            </button>
          )}
          <button onClick={() => setStep("verify_intro")} className="w-full py-2 text-muted-foreground text-sm">
            {t("verify.back")}
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
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
          quality: 80,
        });
        if (!photo.base64String) return;
        setSelfieBase64(photo.base64String);
        setSelfiePreview(`data:image/jpeg;base64,${photo.base64String}`);
      } catch {
        // user cancelled
      }
    }

    async function finishVerification() {
      if (!user || !idPhotoBase64 || !selfieBase64) return;
      setIsSubmitting(true);
      setUploadError(null);
      try {
        await uploadVerificationPhoto(
          idPhotoBase64,
          `${user.id}_id.jpg`
        );
        await uploadVerificationPhoto(
          selfieBase64,
          `${user.id}_selfie.jpg`
        );
        updateProfile(
          { verification_status: "pending" },
          { onSuccess: onComplete, onError: onComplete }
        );
      } catch (err) {
        setUploadError(t("verify.upload_error"));
        setIsSubmitting(false);
      }
    }

    return (
      <div className="mobile-container flex flex-col bg-background pb-10" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-14 pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("verify.selfie_step")}</p>
          <h2
            className="font-serif font-normal text-foreground leading-tight"
            style={{ fontSize: "1.75rem", letterSpacing: "-0.042em" }}
          >
            {t("verify.selfie_title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("verify.selfie_sub")}</p>
        </div>

        <div className="mx-auto mt-4 rounded-full overflow-hidden relative bg-muted" style={{ width: 220, height: 220 }}>
          {selfiePreview ? (
            <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-4xl">🤳</span>
              <p className="text-xs text-muted-foreground mt-2">{t("verify.tap_selfie")}</p>
            </div>
          )}
        </div>

        {uploadError && (
          <p className="mx-6 mt-4 text-xs text-red-400 text-center">{uploadError}</p>
        )}

        <div className="px-6 mt-8 space-y-3">
          {selfiePreview ? (
            <>
              <button
                onClick={finishVerification}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] gradient-cta text-white disabled:opacity-60"
              >
                {isSubmitting ? t("verify.uploading") : t("verify.submit")}
              </button>
              <button
                onClick={() => { setSelfieBase64(null); setSelfiePreview(null); }}
                disabled={isSubmitting}
                className="w-full py-2 text-muted-foreground text-sm disabled:opacity-40"
              >
                {t("verify.retake")}
              </button>
            </>
          ) : (
            <button
              onClick={captureSelfie}
              className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 gradient-cta text-white"
            >
              <Camera size={16} />
              {t("verify.take_selfie")}
            </button>
          )}
          <button
            onClick={() => setStep("verify_id")}
            disabled={isSubmitting}
            className="w-full py-2 text-muted-foreground text-sm disabled:opacity-40"
          >
            {t("verify.back")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
