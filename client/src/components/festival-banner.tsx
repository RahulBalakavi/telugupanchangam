import { Sparkles, ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { Vratham } from "@/lib/vrathams";

interface FestivalBannerProps {
  vratham: Vratham;
  onOpen: (vratham: Vratham) => void;
}

/** Shown on the day a vratham's festival falls — links straight to its guide. */
export function FestivalBanner({ vratham: v, onOpen }: FestivalBannerProps) {
  const { language, t } = useLanguage();
  const festName =
    (language === "telugu" ? v.festivalNameTe : v.festivalNameEn) ||
    (language === "telugu" ? v.nameTe : v.nameEn);

  return (
    <button
      onClick={() => onOpen(v)}
      className="w-full text-left mb-6 rounded-2xl p-5 md:p-6 flex items-center gap-4 text-primary-foreground hover-elevate"
      style={{
        background: "linear-gradient(120deg, hsl(var(--saffron)), hsl(var(--gold)))",
        boxShadow: "0 16px 40px -20px hsl(var(--saffron) / 0.7)",
      }}
      data-testid="festival-banner"
    >
      <span className="flex-none grid place-items-center h-12 w-12 rounded-full bg-white/20 text-2xl backdrop-blur">
        {v.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] font-display tracking-[0.22em] uppercase opacity-90">
          <Sparkles className="h-3.5 w-3.5" />
          {t("నేడు పండుగ", "Today's Festival")}
        </div>
        <p className="font-telugu text-xl md:text-2xl font-semibold mt-0.5">{festName}</p>
        <p className="text-sm opacity-90 mt-0.5">
          {t("పూజ గైడ్ తెరవండి — సామగ్రి & గైడెడ్ పూజ", "Open the puja guide — items to buy & guided puja")}
        </p>
      </div>
      <ChevronRight className="h-6 w-6 flex-none" />
    </button>
  );
}
