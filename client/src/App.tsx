import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { IOSInstallPrompt } from "@/components/ios-install-prompt";
import { LanguageContext, useLanguageProvider } from "@/hooks/use-language";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/today" component={Home} />
      <Route path="/panchangam/:date" component={Home} />
      <Route path="/festivals" component={Home} />
      <Route path="/festivals/:slug" component={Home} />
      <Route path="/vrathams" component={Home} />
      <Route path="/vrathams/:slug" component={Home} />
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
