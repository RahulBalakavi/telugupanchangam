import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, PartyPopper, Flame } from "lucide-react";
import type { Festival } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface FestivalsListProps {
  festivals: Festival[];
  title?: string;
  isLoading?: boolean;
}

export function FestivalsList({ festivals, title = "Upcoming Festivals", isLoading }: FestivalsListProps) {
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

  return (
    <Card data-testid="card-festivals">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {festivals.length === 0 ? (
          <p className="text-muted-foreground text-center py-4" data-testid="text-no-festivals">
            No upcoming festivals
          </p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {festivals.map((festival) => (
                <div
                  key={festival.id}
                  className="p-3 rounded-md bg-muted/50 hover-elevate"
                  data-testid={`card-festival-${festival.id}`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium" data-testid={`text-festival-name-${festival.id}`}>
                        {festival.nameTelugu}
                      </h4>
                      <p className="text-sm text-muted-foreground">{festival.name}</p>
                    </div>
                    <Badge variant={getTypeBadgeVariant(festival.type)} className="shrink-0">
                      {getTypeIcon(festival.type)}
                      <span className="ml-1 capitalize">{festival.type}</span>
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2" data-testid={`text-festival-date-${festival.id}`}>
                    {new Date(festival.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm mt-2 line-clamp-2" data-testid={`text-festival-desc-${festival.id}`}>
                    {festival.descriptionTelugu || festival.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
