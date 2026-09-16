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
          const isSelected = myVotes.includes(opt.id);
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
