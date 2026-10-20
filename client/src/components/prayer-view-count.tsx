import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/use-language";

export function PrayerViewCount({ slug }: { slug: string }) {
  const { language, t } = useLanguage();
  const viewId = useRef<string | null>(null);
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    // StrictMode/retries reuse this opening's ID; a new opening gets a new ID.
    viewId.current ??= crypto.randomUUID();
    let active = true;
    void apiRequest("POST", `/api/vrathams/${slug}/views`, { viewId: viewId.current })
      .then(response => response.json())
      .then(data => {
        if (active && Number.isSafeInteger(data.views) && data.views > 0) setViews(data.views);
      })
      .catch(error => {
        // Hide unavailable social proof; listening and reading remain usable.
        console.warn("Prayer view count unavailable", error);
      });
    return () => { active = false; };
  }, [slug]);

  if (views === null) return null;
  const count = new Intl.NumberFormat(language === "telugu" ? "te-IN" : "en-IN").format(views);
  return (
    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1.5 text-sm text-muted-foreground" data-testid="prayer-view-count">
      <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
      <span title={t("లెక్కింపు ప్రారంభమైనప్పటి నుండి ఈ పేజీ తెరిచిన సార్లు. మళ్లీ చూసినవి కూడా లెక్కలో ఉంటాయి.", "Page openings since tracking began. Repeat visits are included; this is not a count of different people.")}>
        {language === "telugu" ? `ఇప్పటివరకు ${count} సార్లు వీక్షించారు` : `Viewed ${count} ${views === 1 ? "time" : "times"}`}
      </span>
    </div>
  );
}
