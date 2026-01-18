import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MoonPhase } from "./moon-phase";
import { Calendar, Moon, Star, Sunrise, Sunset, MapPin } from "lucide-react";
import type { CalendarDay } from "@shared/schema";

interface DayDetailModalProps {
  day: CalendarDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DayDetailModal({ day, open, onOpenChange }: DayDetailModalProps) {
  if (!day) return null;

  const { panchang, festivals, templeEvents } = day;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="modal-day-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl font-serif">
              {day.date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </DialogTitle>
          <DialogDescription>
            {panchang && (
              <span>
                {panchang.teluguMonth} {panchang.teluguDate}, {panchang.teluguYear}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {panchang && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Panchang Details
                </h3>
                <MoonPhase phase={panchang.moonPhase} size={40} />
              </div>

              {panchang.isSpecialDay && (
                <Badge variant="default" className="mb-2" data-testid="badge-special-day-modal">
                  {panchang.specialDayInfoTelugu || panchang.specialDayInfo}
                </Badge>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Moon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tithi</p>
                    <p className="font-medium text-sm" data-testid="text-modal-tithi">
                      {panchang.pakshaTelugu} {panchang.tithiTelugu}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-accent/20">
                    <Star className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nakshatra</p>
                    <p className="font-medium text-sm" data-testid="text-modal-nakshatra">
                      {panchang.nakshatraTelugu}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-500/10">
                    <Sunrise className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sunrise</p>
                    <p className="font-medium text-sm" data-testid="text-modal-sunrise">
                      {panchang.sunrise}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-orange-500/10">
                    <Sunset className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sunset</p>
                    <p className="font-medium text-sm" data-testid="text-modal-sunset">
                      {panchang.sunset}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 col-span-2">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telugu Month</p>
                    <p className="font-medium text-sm" data-testid="text-modal-month">
                      {panchang.teluguMonth} ({panchang.teluguMonthEnglish})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {festivals.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Festivals
                </h3>
                {festivals.map((festival) => (
                  <div
                    key={festival.id}
                    className="p-3 rounded-md bg-muted/50"
                    data-testid={`modal-festival-${festival.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium">{festival.nameTelugu}</h4>
                        <p className="text-sm text-muted-foreground">{festival.name}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {festival.type}
                      </Badge>
                    </div>
                    <p className="text-sm mt-2">{festival.descriptionTelugu || festival.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {templeEvents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Temple Events
                </h3>
                {templeEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-md bg-muted/50"
                    data-testid={`modal-event-${event.id}`}
                  >
                    <h4 className="font-medium">{event.eventNameTelugu}</h4>
                    <p className="text-sm text-muted-foreground">{event.eventName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <span className="text-base">🛕</span>
                      <span>{event.templeNameTelugu}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.locationTelugu}</span>
                    </div>
                    <p className="text-sm mt-2">{event.descriptionTelugu || event.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
