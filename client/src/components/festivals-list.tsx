import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, PartyPopper, Flame, CalendarSearch } from "lucide-react";
import type { Festival } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FestivalsListProps {
  festivals: Festival[];
  title?: string;
  isLoading?: boolean;
  showPast?: boolean;
  onFestivalClick?: (festival: Festival) => void;
}

export function FestivalsList({ festivals, title, isLoading, showPast, onFestivalClick }: FestivalsListProps) {
  const { language, t } = useLanguage();
  const displayTitle = title || t("రాబోయే పండుగలు", "Upcoming Festivals");

  if (isLoading) {
    return (
      <Card data-testid="card-festivals-loading">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type: Festival["type"]) => {
    switch (type) {
      case "major":
        return <PartyPopper className="h-4 w-4" />;
      case "minor":
        return <Sparkles className="h-4 w-4" />;
      case "regional":
        return <Flame className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: Festival["type"]) => {
    switch (type) {
      case "major":
        return "default";
      case "minor":
        return "secondary";
      case "regional":
        return "outline";
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPast = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00") < today;
  };

  return (
    <Card data-testid="card-festivals">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          {displayTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {festivals.length === 0 ? (
          <p className="text-muted-foreground text-center py-4" data-testid="text-no-festivals">
            {t("పండుగలు లేవు", "No festivals found")}
          </p>
        ) : (
          <ScrollArea className={showPast ? "h-[500px] pr-4" : "h-[300px] pr-4"}>
            <div className="space-y-3">
              {festivals.map((festival) => {
                const past = isPast(festival.date);
                return (
                  <div
                    key={festival.id}
                    className={cn(
                      "p-3 rounded-md bg-muted/50 hover-elevate group",
                      past && "opacity-60",
                      onFestivalClick && "cursor-pointer"
                    )}
                    onClick={() => onFestivalClick?.(festival)}
                    data-testid={`card-festival-${festival.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium" data-testid={`text-festival-name-${festival.id}`}>
                          {language === "telugu" ? festival.nameTelugu : festival.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {past && (
                          <Badge variant="outline" className="text-xs">
                            {t("గత", "Past")}
                          </Badge>
                        )}
                        <Badge variant={getTypeBadgeVariant(festival.type)}>
                          {getTypeIcon(festival.type)}
                          <span className="ml-1 capitalize">
                            {language === "telugu" 
                              ? (festival.type === "major" ? "ప్రధాన" : festival.type === "minor" ? "చిన్న" : "ప్రాంతీయ")
                              : festival.type
                            }
                          </span>
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <p className="text-xs text-muted-foreground" data-testid={`text-festival-date-${festival.id}`}>
                        {new Date(festival.date + "T12:00:00").toLocaleDateString(language === "telugu" ? "te-IN" : "en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {onFestivalClick && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFestivalClick(festival);
                          }}
                          data-testid={`button-festival-calendar-${festival.id}`}
                          title={t("క్యాలెండర్‌లో చూడండి", "View in calendar")}
                        >
                          <CalendarSearch className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm mt-2 line-clamp-2" data-testid={`text-festival-desc-${festival.id}`}>
                      {language === "telugu" ? (festival.descriptionTelugu || festival.description) : festival.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
