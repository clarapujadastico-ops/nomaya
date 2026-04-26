import { useState, useEffect, useRef } from "react";
import { Shield, Camera, SkipForward, ZapOff, Zap } from "lucide-react";
import { CameraPreview } from "@capacitor-community/camera-preview";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useLang } from "@/contexts/LanguageContext";

type VerifyStep = "verify_intro" | "verify_id" | "verify_selfie";

interface VerificationFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

async function uploadVerificationPhoto(base64: string, path: string): Promise<void> {
  const chars = atob(base64);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
  const blob = new Blob([bytes], { type: "image/jpeg" });
  const { error } = await supabase.storage
    .from("Verification")
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (error) throw error;
}

// Live camera scanner with rectangle overlay
function IDScanner({ onCapture, onCancel, mode }: {
  onCapture: (base64: string) => void;
  onCancel: () => void;
  mode: 'id' | 'selfie';
}) {
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function start() {
      try {
        await CameraPreview.start({
          position: mode === 'selfie' ? 'front' : 'rear',
          parent: 'cameraPreviewContainer',
          className: 'cameraPreview',
          toBack: false,
          width: window.innerWidth,
          height: window.innerHeight,
          enableZoom: mode === 'id',
        });
        if (mounted) setIsStarted(true);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      }
    }
    start();
    return () => {
      mounted = false;
      CameraPreview.stop().catch(() => {});
    };
  }, [mode]);

  async function capture() {
    if (capturing) return;
    setCapturing(true);
    try {
      const result = await CameraPreview.capture({ quality: 85 });
      await CameraPreview.stop();
      onCapture(result.value);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCapturing(false);
    }
  }

  async function toggleTorch() {
    try {
      await CameraPreview.setFlash({ isEnable: !torch });
      setTorch(!torch);
    } catch {}
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-white text-sm text-center">{error}</p>
        <button onClick={onCancel} className="text-white underline text-sm">Go back</button>
      </div>
    );
  }

  const isId = mode === 'id';

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera preview container */}
      <div id="cameraPreviewContainer" className="absolute inset-0" />

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Dark overlay with cutout */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Guide frame */}
        {isId ? (
          // ID card rectangle — landscape ratio
          <div
            className="relative z-10"
            style={{ width: '85vw', height: '54vw' }}
          >
            <div className="absolute inset-0 rounded-xl border-2 border-white/80" />
            {/* Corner accents */}
            {[
              'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
              'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
              'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
              'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-8 h-8 border-white ${cls}`} />
            ))}
          </div>
        ) : (
          // Selfie circle
          <div
            className="relative z-10 rounded-full border-4 border-white/80"
            style={{ width: '70vw', height: '70vw' }}
          />
        )}

        {/* Instruction text */}
        <p className="relative z-10 text-white text-sm text-center mt-5 px-8">
          {isId
            ? 'Place your ID flat within the frame'
            : 'Position your face in the circle'}
        </p>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-14 pb-4">
        <button onClick={onCancel} className="text-white text-sm bg-black/40 px-4 py-2 rounded-full">
          Cancel
        </button>
        {isId && isStarted && (
          <button onClick={toggleTorch} className="text-white bg-black/40 p-2 rounded-full pointer-events-auto">
            {torch ? <Zap size={20} /> : <ZapOff size={20} />}
          </button>
        )}
      </div>

      {/* Capture button */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center pb-14">
        <button
          onClick={capture}
          disabled={!isStarted || capturing}
          className="w-20 h-20 rounded-full bg-white disabled:opacity-50 flex items-center justify-center shadow-lg pointer-events-auto"
          style={{ border: '4px solid rgba(255,255,255,0.5)' }}
        >
          <div className="w-14 h-14 rounded-full bg-white border-2 border-gray-200" />
        </button>
      </div>
    </div>
  );
}

export function VerificationFlow({ onComplete, onSkip }: VerificationFlowProps) {
  const [step, setStep] = useState<VerifyStep>("verify_intro");
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'id' | 'selfie'>('id');
  const [idPhotoBase64, setIdPhotoBase64] = useState<string | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { user } = useAuth();
  const { mutate: updateProfile } = useUpdateProfile();
  const { t } = useLang();

  function openScanner(mode: 'id' | 'selfie') {
    setScannerMode(mode);
    setShowScanner(true);
  }

  function handleCapture(base64: string) {
    setShowScanner(false);
    if (scannerMode === 'id') {
      setIdPhotoBase64(base64);
      setIdPhotoPreview(`data:image/jpeg;base64,${base64}`);
    } else {
      setSelfieBase64(base64);
      setSelfiePreview(`data:image/jpeg;base64,${base64}`);
    }
  }

  async function finishVerification() {
    if (!user || !idPhotoBase64 || !selfieBase64) return;
    setIsSubmitting(true);
    setUploadError(null);
    try {
      await uploadVerificationPhoto(idPhotoBase64, `${user.id}_id.jpg`);
      await uploadVerificationPhoto(selfieBase64, `${user.id}_selfie.jpg`);
      updateProfile({ verification_status: "pending" }, { onSuccess: onComplete, onError: onComplete });
    } catch {
      setUploadError(t("verify.upload_error"));
      setIsSubmitting(false);
    }
  }

  /* ── SCANNER OVERLAY ── */
  if (showScanner) {
    return (
      <IDScanner
        mode={scannerMode}
        onCapture={handleCapture}
        onCancel={() => setShowScanner(false)}
      />
    );
  }

  /* ── VERIFY INTRO ── */
  if (step === "verify_intro") {
    return (
      <div className="mobile-container flex flex-col bg-background px-6 pt-screen-top pb-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("verify.step_3")}</p>
          <h2 className="font-serif font-normal text-foreground leading-tight" style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}>
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
            onClick={() => updateProfile({ verification_status: "unverified" }, { onSuccess: onSkip, onError: onSkip })}
            className="w-full py-3 text-muted-foreground text-sm flex items-center justify-center gap-1"
          >
            <SkipForward size={14} />
            {t("verify.skip")}
          </button>
        </div>
      </div>
    );
  }

  /* ── VERIFY ID ── */
  if (step === "verify_id") {
    return (
      <div className="mobile-container flex flex-col bg-background pb-10" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-screen-top pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("verify.id_step")}</p>
          <h2 className="font-serif font-normal text-foreground leading-tight" style={{ fontSize: "1.75rem", letterSpacing: "-0.042em" }}>
            {t("verify.scan_title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("verify.scan_sub")}</p>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t("verify.gender_note")}</p>
        </div>

        {/* Preview / tap area */}
        <div
          className="mx-6 rounded-2xl overflow-hidden relative bg-muted flex-1 cursor-pointer active:opacity-80"
          style={{ minHeight: 220 }}
          onClick={() => openScanner('id')}
        >
          {idPhotoPreview ? (
            <img src={idPhotoPreview} alt="ID preview" className="w-full h-full object-cover" style={{ minHeight: 220 }} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ minHeight: 220 }}>
              {/* ID card skeleton */}
              <div className="relative" style={{ width: '70%', aspectRatio: '85/54' }}>
                <div className="absolute inset-0 rounded-lg border-2 border-muted-foreground/30" />
                {['top-0 left-0 border-t-2 border-l-2 rounded-tl-lg',
                  'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg',
                  'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg',
                  'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-5 h-5 border-foreground/50 ${cls}`} />
                ))}
                <Camera size={20} className="absolute inset-0 m-auto text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{t("verify.tap_id")}</p>
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
              onClick={() => openScanner('id')}
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
    return (
      <div className="mobile-container flex flex-col bg-background pb-10" style={{ minHeight: "100dvh" }}>
        <div className="px-6 pt-screen-top pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{t("verify.selfie_step")}</p>
          <h2 className="font-serif font-normal text-foreground leading-tight" style={{ fontSize: "1.75rem", letterSpacing: "-0.042em" }}>
            {t("verify.selfie_title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("verify.selfie_sub")}</p>
        </div>

        <button
          onClick={() => openScanner('selfie')}
          className="mx-auto mt-4 rounded-full overflow-hidden relative bg-muted active:opacity-80"
          style={{ width: 220, height: 220, display: 'block' }}
        >
          {selfiePreview ? (
            <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-4xl">🤳</span>
              <p className="text-xs text-muted-foreground mt-2">{t("verify.tap_selfie")}</p>
            </div>
          )}
        </button>

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
              onClick={() => openScanner('selfie')}
              className="w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 gradient-cta text-white"
            >
              <Camera size={16} />
              {t("verify.take_selfie")}
            </button>
          )}
          <button onClick={() => setStep("verify_id")} disabled={isSubmitting} className="w-full py-2 text-muted-foreground text-sm disabled:opacity-40">
            {t("verify.back")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
