import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ChartLine, Mail, User } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, name);
      setLocation("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleDemoLogin = async () => {
    try {
      await login("demo@xenocrm.com", "Demo User");
      setLocation("/");
    } catch (error) {
      console.error("Demo login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <ChartLine className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to Xeno CRM</CardTitle>
          <p className="text-muted-foreground">
            Sign in to access your campaign management platform
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            Try Demo Account
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            This is a demo application. In production, this would integrate with Google OAuth 2.0.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
