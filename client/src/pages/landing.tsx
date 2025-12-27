import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SiGoogle } from "react-icons/si";
import { Shield, Building2, AlertCircle, X } from "lucide-react";

export default function LandingPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam === "access_denied") {
      setError("Access denied. Only @universalawning.com accounts are allowed.");
      // Clean up URL
      window.history.replaceState({}, document.title, "/");
    } else if (errorParam === "auth_failed") {
      setError("Authentication failed. Please try again.");
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleLogin = () => {
    setError(null);
    window.location.href = "/api/login";
  };

  const dismissError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex items-center gap-3">
              <Building2 className="h-10 w-10 text-primary" />
              <span className="text-2xl font-semibold text-foreground">Universal Awning</span>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">Sign in to your workspace</CardTitle>
            <CardDescription className="text-muted-foreground">
              Use your @universalawning.com account to continue
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="relative">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign-in Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={dismissError}
                data-testid="button-dismiss-error"
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          )}
          
          <Button
            onClick={handleLogin}
            className="w-full gap-3"
            size="lg"
            data-testid="button-google-login"
          >
            <SiGoogle className="h-5 w-5" />
            Sign in with Google
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure sign-in with your company account</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
