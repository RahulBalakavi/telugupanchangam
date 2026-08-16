import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { trackPageview } from "@/lib/track";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { IOSInstallPrompt } from "@/components/ios-install-prompt";
import { LanguageContext, useLanguageProvider } from "@/hooks/use-language";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import EclipsesPage from "@/pages/eclipses";
import RahuKalamPage from "@/pages/rahu-kalam";

// three.js + the orrery only load when someone opens /sky.
const SkyPage = lazy(() => import("@/pages/sky"));

function Router() {
  const [location] = useLocation();
  useEffect(() => {
    trackPageview(location);
    // Route-change depth for this tab — /sky's Back button uses it to decide
    // whether history.back() stays inside the app or would leave the site.
    const depth = Number(sessionStorage.getItem("nav-depth") || "0");
    sessionStorage.setItem("nav-depth", String(depth + 1));
  }, [location]);
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/today" component={Home} />
      <Route path="/panchangam/:date" component={Home} />
      <Route path="/festivals" component={Home} />
      <Route path="/festivals/:slug" component={Home} />
      <Route path="/vrathams" component={Home} />
      <Route path="/vrathams/:slug" component={Home} />
      <Route path="/eclipses" component={EclipsesPage} />
      <Route path="/rahu-kalam" component={RahuKalamPage} />
      <Route path="/sky">
        <Suspense fallback={<div className="min-h-screen grid place-items-center bg-[#050510] text-white/50 text-sm">Loading the sky…</div>}>
          <SkyPage />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function LanguageProvider({ children }: { children: React.ReactNode }) {
  const languageValue = useLanguageProvider();
  return (
    <LanguageContext.Provider value={languageValue}>
      {children}
    </LanguageContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <IOSInstallPrompt />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
