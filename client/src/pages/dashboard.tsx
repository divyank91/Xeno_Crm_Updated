import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Megaphone, Send, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface DashboardStats {
  totalCustomers: number;
  activeCampaigns: number;
  deliveryRate: string;
  revenueImpact: number;
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  if (authLoading || !user) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">Loading...</div>
    </div>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard"
          description="Overview of your CRM performance and activities"
        />
        
        <main className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {statsLoading ? "..." : stats?.totalCustomers?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+12%</span>
                  <span className="text-muted-foreground ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {statsLoading ? "..." : stats?.activeCampaigns || "0"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+5</span>
                  <span className="text-muted-foreground ml-1">this week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {statsLoading ? "..." : `${stats?.deliveryRate || "0"}%`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Send className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+2.1%</span>
                  <span className="text-muted-foreground ml-1">improvement</span>
                </div>
              </CardContent>
            </Card>

            <Card className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenue Impact</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {statsLoading ? "..." : `₹${(stats?.revenueImpact || 0).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+18%</span>
                  <span className="text-muted-foreground ml-1">vs target</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setLocation("/campaigns")}
                    className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Megaphone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Create New Campaign</p>
                        <p className="text-sm text-muted-foreground">Build and launch targeted campaigns</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Import Customers</p>
                        <p className="text-sm text-muted-foreground">Add customer data via API or CSV</p>
                      </div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-muted-foreground">Campaign delivery completed</span>
                    <span className="text-xs text-muted-foreground ml-auto">2h ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-muted-foreground">New customers imported</span>
                    <span className="text-xs text-muted-foreground ml-auto">4h ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-muted-foreground">Campaign created</span>
                    <span className="text-xs text-muted-foreground ml-auto">1d ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
