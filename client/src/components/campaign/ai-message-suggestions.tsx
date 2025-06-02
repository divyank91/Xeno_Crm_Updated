import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Copy, Clock, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageSuggestion {
  type: string;
  message: string;
  engagement: string;
}

const defaultSuggestions: MessageSuggestion[] = [
  {
    type: "Win-back Campaign",
    message: "Hi {{name}}, we miss you! Come back and enjoy 15% off your next purchase.",
    engagement: "8.2%"
  },
  {
    type: "Urgency-based",
    message: "{{name}}, only 24 hours left! Don't miss out on exclusive deals curated for you.",
    engagement: "12.5%"
  },
  {
    type: "Value-focused",
    message: "Thank you for being a valued customer, {{name}}! Here's a special 20% off just for you.",
    engagement: "9.8%"
  }
];

export function AiMessageSuggestions() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<MessageSuggestion[]>(defaultSuggestions);

  const { mutate: generateMessages, isPending: isGenerating } = useMutation({
    mutationFn: async (data: { objective: string; audienceDescription: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-message", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.messages);
      toast({
        title: "New messages generated",
        description: "AI has created fresh message suggestions for your campaign",
      });
    },
    onError: () => {
      toast({
        title: "Generation failed",
        description: "Unable to generate message suggestions",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({
      title: "Message copied",
      description: "The message has been copied to your clipboard",
    });
  };

  const generateNewMessages = () => {
    generateMessages({
      objective: "increase engagement",
      audienceDescription: "high-value customers"
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Message Suggestions */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold">AI Message Suggestions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-2">{suggestion.type}</p>
                  <p className="text-sm text-muted-foreground mb-3">"{suggestion.message}"</p>
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant="secondary" 
                      className={
                        suggestion.type.includes("Urgency") 
                          ? "bg-orange-100 text-orange-700"
                          : suggestion.type.includes("Value")
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    >
                      {suggestion.type.includes("Urgency") ? "Urgent" : 
                       suggestion.type.includes("Value") ? "Appreciation" : "Personalized"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Engagement: {suggestion.engagement}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(suggestion.message)}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            onClick={generateNewMessages}
            disabled={isGenerating}
            variant="ghost"
            className="w-full text-purple-600 hover:text-purple-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            {isGenerating ? "Generating..." : "Generate More Variations"}
          </Button>
        </CardContent>
      </Card>

      {/* Smart Scheduling */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">Smart Scheduling</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">AI Recommendation</p>
            </div>
            <p className="text-sm text-blue-800">
              Based on your audience's activity patterns, the best time to send is{" "}
              <strong>Tuesday at 2:00 PM</strong> for 23% higher engagement.
            </p>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Send Date & Time</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <input
                  type="time"
                  defaultValue="14:00"
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoOptimize"
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="autoOptimize" className="text-sm text-foreground">
                Auto-optimize send time per customer
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
