import { Check } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useActivePoll, useMyPollVotes, useTogglePollVote } from "@/hooks/usePolls";

export function PollBanner({ city }: { city: string }) {
  const { t, lang } = useLang();
  const { data: poll } = useActivePoll(city);
  const { data: myVotes = [] } = useMyPollVotes(poll?.id);
  const { mutate: toggleVote } = useTogglePollVote();

  if (!poll) return null;

  const question = lang === "es" && poll.question_es ? poll.question_es : poll.question;

  return (
    <div className="mx-5 mb-5 bg-card rounded-2xl p-4 shadow-soft border border-dashed border-border">
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

            // Once a date is picked, this becomes a plain toggle button (tap
            // to remove) — the date input only needs to sit on top, capturing
            // the real tap directly, while nothing has been picked yet.
            // A synthetic input.click() from a separate button's onClick does
            // NOT reliably open iOS's native date wheel; only a genuine touch
            // on the input itself does.
            if (isSelected) {
              return (
                <button
                  key={opt.id}
                  onClick={() =>
                    toggleVote({ pollId: poll.id, optionId: opt.id, currentlySelected: true, multiSelect: poll.multi_select })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95"
                  style={{ borderColor: "hsl(var(--nomaya-purple))", background: "hsl(var(--nomaya-purple) / 0.15)" }}
                >
                  <Check size={11} />
                  {pillLabel}
                </button>
              );
            }

            return (
              <div key={opt.id} className="relative">
                <button
                  tabIndex={-1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
                >
                  {label}
                </button>
                <input
                  type="date"
                  aria-label={label}
                  className="absolute inset-0 w-full h-full opacity-0"
                  onChange={(e) => {
                    if (!e.target.value) return;
                    toggleVote({
                      pollId: poll.id,
                      optionId: opt.id,
                      currentlySelected: false,
                      multiSelect: poll.multi_select,
                      customDate: e.target.value,
                    });
                  }}
                />
              </div>
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
