import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Calendar } from "lucide-react";
import type { TempleEvent } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface TempleEventsProps {
  events: TempleEvent[];
  isLoading?: boolean;
}

export function TempleEvents({ events, isLoading }: TempleEventsProps) {
  if (isLoading) {
    return (
      <Card data-testid="card-temple-events-loading">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-temple-events">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <span className="text-xl">🛕</span>
          Temple Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-4" data-testid="text-no-events">
            No upcoming temple events
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-md border bg-card hover-elevate"
                  data-testid={`card-temple-event-${event.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base" data-testid={`text-event-name-${event.id}`}>
                        {event.eventNameTelugu}
                      </h4>
                      <p className="text-sm text-muted-foreground">{event.eventName}</p>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-lg">🛕</span>
                          <span className="font-medium" data-testid={`text-temple-name-${event.id}`}>
                            {event.templeNameTelugu}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-7">{event.templeName}</p>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span data-testid={`text-location-${event.id}`}>
                            {event.locationTelugu} ({event.location})
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span data-testid={`text-event-date-${event.id}`}>
                            {new Date(event.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}`}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm mt-3 text-muted-foreground" data-testid={`text-event-desc-${event.id}`}>
                        {event.descriptionTelugu || event.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
