import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RuleBuilder } from "@/components/campaign/rule-builder";
import { AiMessageSuggestions } from "@/components/campaign/ai-message-suggestions";
import { CampaignHistory } from "@/components/campaign/campaign-history";

export default function Campaigns() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

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
          title="Campaign Management"
          description="Create and manage customer campaigns with intelligent segmentation"
        />
        
        <main className="flex-1 overflow-auto p-6">
          {/* Campaign Creation Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RuleBuilder />
            <AiMessageSuggestions />
          </div>

          {/* Campaign History */}
          <CampaignHistory />
        </main>
      </div>
    </div>
  );
}
