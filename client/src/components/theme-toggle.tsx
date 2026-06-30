import { Moon, Sun, SunMoon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme-provider";
import { useLanguage } from "@/hooks/use-language";

export function ThemeToggle() {
  const { theme, mode, setTheme, useAutoTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-theme-toggle" title={t("థీమ్", "Theme")}>
          {mode === "auto" ? (
            <SunMoon className="h-5 w-5" />
          ) : theme === "dark" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => setTheme("light")} data-testid="theme-day">
          <Sun className="h-4 w-4 mr-2" />
          {t("పగలు", "Day")}
          {mode === "manual" && theme === "light" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} data-testid="theme-night">
          <Moon className="h-4 w-4 mr-2" />
          {t("రాత్రి", "Night")}
          {mode === "manual" && theme === "dark" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={useAutoTheme} data-testid="theme-auto">
          <SunMoon className="h-4 w-4 mr-2" />
          {t("ఆటో (సమయం)", "Auto (by time)")}
          {mode === "auto" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
