import { Check } from "lucide-react";
import { DatetimePicker } from "@capawesome-team/capacitor-datetime-picker";
import { useLang } from "@/contexts/LanguageContext";
import { useActivePoll, useMyPollVotes, useTogglePollVote } from "@/hooks/usePolls";

export function PollBanner({ city, className = "mx-5 mb-5" }: { city: string; className?: string }) {
  const { t, lang } = useLang();
  const { data: poll } = useActivePoll(city);
  const { data: myVotes = [] } = useMyPollVotes(poll?.id);
  const { mutate: toggleVote } = useTogglePollVote();

  if (!poll) return null;

  const question = lang === "es" && poll.question_es ? poll.question_es : poll.question;

  return (
    <div className={`${className} bg-card rounded-2xl p-4 shadow-soft border border-dashed border-border`}>
      <p className="text-[10px] uppercase tracking-widest text-primary font-medium mb-1.5">{t("poll.eyebrow")}</p>
      <h2 className="font-serif text-base font-medium text-foreground leading-snug mb-3">{question}</h2>
      <div className="flex flex-wrap gap-2">
        {poll.options.map((opt) => {
          const label = lang === "es" && opt.label_es ? opt.label_es : opt.label;
          const myVote = myVotes.find((v) => v.option_id === opt.id);
          const isSelected = !!myVote;

          if (opt.isCustomDate) {
            const pillLabel = myVote?.custom_date
              ? new Date(`${myVote.custom_date}T00:00:00`).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" })
              : label;

            return (
              <button
                key={opt.id}
                onClick={async () => {
                  if (isSelected) {
                    toggleVote({ pollId: poll.id, optionId: opt.id, currentlySelected: true, multiSelect: poll.multi_select });
                    return;
                  }
                  // An <input type="date"> overlay opened and immediately
                  // closed iOS's native date wheel inside the WKWebView —
                  // a long-standing WKWebView quirk with that form control.
                  // The native picker plugin doesn't have that problem.
                  try {
                    const { value } = await DatetimePicker.present({
                      mode: "date",
                      format: "yyyy-MM-dd",
                      value: myVote?.custom_date ?? new Date().toISOString().slice(0, 10),
                      locale: lang === "es" ? "es-ES" : "en-US",
                    });
                    toggleVote({
                      pollId: poll.id,
                      optionId: opt.id,
                      currentlySelected: false,
                      multiSelect: poll.multi_select,
                      customDate: value,
                    });
                  } catch {
                    // User cancelled the picker — nothing to do.
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95"
                style={{
                  borderColor: isSelected ? "hsl(var(--nomaya-purple))" : "hsl(var(--border))",
                  background: isSelected ? "hsl(var(--nomaya-purple) / 0.15)" : "hsl(var(--card))",
                }}
              >
                {isSelected && <Check size={11} />}
                {pillLabel}
              </button>
            );
          }

          return (
            <button
              key={opt.id}
              onClick={() =>
                toggleVote({ pollId: poll.id, optionId: opt.id, currentlySelected: isSelected, multiSelect: poll.multi_select })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95"
              style={{
                borderColor: isSelected ? "hsl(var(--nomaya-purple))" : "hsl(var(--border))",
                background: isSelected ? "hsl(var(--nomaya-purple) / 0.15)" : "hsl(var(--card))",
              }}
            >
              {isSelected && <Check size={11} />}
              {label}
            </button>
          );
        })}
      </div>
      {poll.multi_select && <p className="text-[10px] text-muted-foreground mt-2.5">{t("poll.multi_hint")}</p>}
    </div>
  );
}
