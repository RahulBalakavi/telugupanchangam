import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Moon, Bell, MapPin, Clock, Star } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🙏</span>
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
                తెలుగు పంచాంగం
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Telugu Panchangam
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In with Google</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                తెలుగు పంచాంగం
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground mb-4">
                Your Daily Telugu Hindu Calendar
              </p>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Get accurate daily tithis, nakshatras, festivals, and temple events from important temples across India - all in one beautiful app.
              </p>
              <Button size="lg" asChild className="text-lg px-8" data-testid="button-get-started">
                <a href="/api/login">Get Started</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl md:text-3xl font-serif font-semibold text-center mb-12">
              Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Moon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Daily Panchang</h4>
                      <p className="text-sm text-muted-foreground">
                        Accurate tithi, nakshatra with precise start and end times. Know exactly when each tithi begins and ends.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-accent/20">
                      <Clock className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Timezone Support</h4>
                      <p className="text-sm text-muted-foreground">
                        All times adjusted to your local timezone. Sunrise, sunset, and tithi timings in your time.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Festival Calendar</h4>
                      <p className="text-sm text-muted-foreground">
                        Never miss important festivals like Ugadi, Dussehra, Deepavali with our curated Telugu calendar.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-amber-500/10">
                      <MapPin className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Temple Events</h4>
                      <p className="text-sm text-muted-foreground">
                        Stay updated with brahmotsavams and special events from Tirumala, Srisailam, Bhadrachalam, and more.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-orange-500/10">
                      <Bell className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Smart Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Get reminders for Ekadashi, Chaturthi, Purnima, and Amavasya - never miss important observances.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Bilingual Content</h4>
                      <p className="text-sm text-muted-foreground">
                        All information available in both Telugu and English for easy understanding.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl md:text-3xl font-serif font-semibold mb-6">
              Ready to get started?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Sign in with your Google account to access the full Telugu Panchangam calendar with personalized features.
            </p>
            <Button size="lg" asChild data-testid="button-sign-in-bottom">
              <a href="/api/login">Sign In with Google</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Telugu Panchangam - తెలుగు పంచాంగం</p>
          <p className="mt-1">Traditional Hindu calendar with tithis, nakshatras, and temple events</p>
        </div>
      </footer>
    </div>
  );
}
