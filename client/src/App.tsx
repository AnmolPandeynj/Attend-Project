import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

// Pages
import FacultyLogin from "@/pages/FacultyLogin";
import StudentLogin from "@/pages/StudentLogin"; 
import FacultyDashboard from "@/pages/FacultyDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <FacultyLogin />} />
      <Route path="/faculty/login" component={FacultyLogin} />
      <Route path="/student/login" component={StudentLogin} />
      <Route path="/faculty/dashboard" component={FacultyDashboard} />
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
