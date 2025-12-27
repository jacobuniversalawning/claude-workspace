import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calculator } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-foreground">Universal Awning</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cost Sheet Calculator
            </CardTitle>
            <CardDescription>
              Universal Awning workspace application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your workspace is ready. Start building your application features here.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
