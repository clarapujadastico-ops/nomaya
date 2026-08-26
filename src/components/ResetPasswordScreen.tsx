import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

// Shown when the app is opened via the password-reset deep link
// (nomaya://reset-password) — takes over the whole screen regardless of
// onboarding/session state until the user sets a new password.
export function ResetPasswordScreen() {
  const { updatePassword, clearPasswordRecovery } = useAuth();
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!password || password.length < 6) return;
    if (password !== confirm) {
      setError(t("auth.passwords_no_match"));
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await updatePassword(password);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="mobile-container flex flex-col bg-background px-6" style={{ minHeight: "100dvh" }}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-6">✅</div>
          <h2 className="font-serif font-normal text-foreground mb-3" style={{ fontSize: "2rem", letterSpacing: "-0.042em" }}>
            {t("auth.password_updated")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            {t("auth.password_updated_sub")}
          </p>
        </div>
        <div className="pb-10">
          <button
            onClick={clearPasswordRecovery}
            className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] gradient-cta text-white"
          >
            {t("auth.continue")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container flex flex-col bg-background" style={{ minHeight: "100dvh" }}>
      <div className="px-6 pt-16 pb-8 text-center">
        <h1 className="font-serif font-normal text-foreground mb-2" style={{ fontSize: "clamp(2.5rem, 12vw, 3.5rem)", letterSpacing: "-0.04em" }}>
          Nomaya
        </h1>
        <p className="text-xs text-muted-foreground tracking-[0.25em] uppercase">
          {t("auth.new_password_title")}
        </p>
      </div>

      <div className="flex-1 px-6">
        <p className="text-sm text-muted-foreground mb-6">{t("auth.new_password_sub")}</p>
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              {t("auth.new_password")}
            </label>
            <input
              type="password"
              placeholder={t("auth.password_hint")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">
              {t("auth.confirm_password")}
            </label>
            <input
              type="password"
              placeholder={t("auth.password_hint")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-3.5 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition"
            />
          </div>
        </div>

        {error && <p className="text-xs text-destructive mb-4 px-1">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !password || !confirm}
          className="w-full py-4 rounded-2xl font-medium text-sm tracking-wide transition-all duration-200 active:scale-[0.98] gradient-cta text-white disabled:opacity-50"
        >
          {loading ? t("auth.sending") : t("auth.save_password")}
        </button>
      </div>
    </div>
  );
}
