import { Mail } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";

const feedbackHref = "mailto:hi@zentra.lol?subject=Zentra%20feedback";

export function FeedbackSection() {
  return (
    <section
      aria-labelledby="help-feedback-heading"
      className="border-t border-white/10 pt-10"
    >
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Support
        </p>
        <h2
          id="help-feedback-heading"
          className={`${spaceGrotesk.className} mt-2 text-xl font-light text-white`}
        >
          Help &amp; feedback
        </h2>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-medium text-white">
            Found a problem or have a suggestion?
          </p>
          <p className="mt-1.5 text-sm leading-6 text-white/55">
            Email us at{" "}
            <span className="font-medium text-white/80">hi@zentra.lol</span>
          </p>
        </div>
        <a
          href={feedbackHref}
          className={`${spaceGrotesk.className} inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-surface transition-opacity hover:opacity-90`}
        >
          <Mail className="h-3.5 w-3.5" aria-hidden />
          Email us
        </a>
      </div>
    </section>
  );
}
