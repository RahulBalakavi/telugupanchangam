import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={(value) => setLanguage(value as "telugu" | "english")}>
        <SelectTrigger className="w-28" data-testid="select-language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="telugu" data-testid="option-telugu">తెలుగు</SelectItem>
          <SelectItem value="english" data-testid="option-english">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
