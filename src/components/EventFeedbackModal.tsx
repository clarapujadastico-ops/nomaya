import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { markFeedbackShown } from "@/hooks/usePendingEventFeedback";

interface Props {
  event: { id: string; title: string };
  onDismiss: () => void;
}

const CHIPS = [
  { key: "loved_activity",   label: "🎨 Loved the activity" },
  { key: "great_energy",     label: "✨ Amazing group energy" },
  { key: "met_great_people", label: "👋 Met great people" },
  { key: "felt_comfortable", label: "🌸 Felt very comfortable" },
  { key: "great_venue",      label: "📍 Great venue" },
  { key: "perfect_timing",   label: "⏰ Perfect timing" },
  { key: "would_come_back",  label: "💜 Would come back" },
  { key: "could_be_longer",  label: "⏱️ Could be longer" },
  { key: "needs_improvement",label: "💡 Needs improvement" },
];

export function EventFeedbackModal({ event, onDismiss }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function toggleChip(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function dismiss() {
    markFeedbackShown(event.id);
    onDismiss();
  }

  async function handleSubmit() {
    if (rating === 0 && selected.size === 0) return;
    setSubmitting(true);
    const chipLabels = CHIPS.filter(c => selected.has(c.key)).map(c => c.label).join(", ");
    const message = [chipLabels, note.trim()].filter(Boolean).join("\n\n");
    await supabase.from("feedback").insert({
      user_id: user?.id,
      rating: rating || null,
      message: `[Event: ${event.title}]\n${message}`,
      type: "event_feedback",
    });
    markFeedbackShown(event.id);
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />
      <div
        className="relative w-full max-w-md bg-background rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: "92dvh", paddingBottom: "max(2rem, env(safe-area-inset-bottom, 0px))" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <button onClick={dismiss} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card flex items-center justify-center">
          <X size={16} className="text-muted-foreground" />
        </button>

        <div className="px-6 pt-3 pb-2 space-y-5">
          {submitted ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-4xl">💜</p>
              <p className="font-serif text-2xl font-medium text-foreground">Thank you!</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your feedback helps us make every gathering better.
              </p>
              <button
                onClick={dismiss}
                className="mt-4 w-full py-3.5 rounded-2xl gradient-cta text-white font-medium text-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Just attended</p>
                <h2 className="font-serif text-xl font-medium text-foreground leading-snug">{event.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">How was it? Your thoughts shape what comes next.</p>
              </div>

              {/* Star rating */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Overall</p>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-all active:scale-110 ${star <= rating ? "opacity-100" : "opacity-20"}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Guided chips */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">What stood out?</p>
                <div className="flex flex-wrap gap-2">
                  {CHIPS.map(c => (
                    <button
                      key={c.key}
                      onClick={() => toggleChip(c.key)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all border ${
                        selected.has(c.key)
                          ? "bg-primary/20 border-primary/50 text-foreground"
                          : "bg-card border-border text-muted-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Anything else?</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Tell us more — what could we do even better?"
                  rows={3}
                  className="w-full bg-card rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                />
              </div>

              <button
                disabled={rating === 0 && selected.size === 0 || submitting}
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl gradient-cta text-white font-medium text-base disabled:opacity-40 transition-opacity"
              >
                {submitting ? "Sending…" : "Send feedback"}
              </button>

              <button onClick={dismiss} className="w-full text-center text-xs text-muted-foreground pb-2">
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
