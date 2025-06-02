import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot, Save, Rocket, Plus, Trash2, Users } from "lucide-react";
import type { SegmentRule } from "@shared/schema";

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic?: "AND" | "OR";
}

export function RuleBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [campaignName, setCampaignName] = useState("");
  const [naturalLanguage, setNaturalLanguage] = useState("");
  const [rules, setRules] = useState<Rule[]>([
    { id: "1", field: "totalSpent", operator: "gt", value: "10000" }
  ]);
  const [message, setMessage] = useState("Hi {{name}}, here's a special offer just for you!");
  const [audienceSize, setAudienceSize] = useState(0);

  // Calculate audience size
  const { mutate: calculateAudienceSize, isPending: isCalculating } = useMutation({
    mutationFn: async (segmentRules: SegmentRule[]) => {
      const response = await apiRequest("POST", "/api/audience/size", { rules: segmentRules });
      return response.json();
    },
    onSuccess: (data) => {
      setAudienceSize(data.size);
    },
  });

  // Convert natural language to rules
  const { mutate: convertToRules, isPending: isConverting } = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/ai/convert-rules", { naturalLanguage: text });
      return response.json();
    },
    onSuccess: (data) => {
      const newRules = data.rules.map((rule: SegmentRule, index: number) => ({
        id: Date.now() + index,
        ...rule
      }));
      setRules(newRules);
      setAudienceSize(data.audienceSize);
      setNaturalLanguage("");
      toast({
        title: "Rules converted successfully",
        description: `Found ${data.audienceSize} matching customers`,
      });
    },
    onError: () => {
      toast({
        title: "Conversion failed",
        description: "Unable to convert natural language to rules",
        variant: "destructive",
      });
    },
  });

  // Create campaign
  const { mutate: createCampaign, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      const segmentRules = rules.map(rule => ({
        field: rule.field,
        operator: rule.operator,
        value: rule.value
      }));

      const response = await apiRequest("POST", "/api/campaigns", {
        name: campaignName,
        rules: segmentRules,
        message,
        audienceSize,
        status: "sending"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign created successfully",
        description: "Your campaign is now being sent to customers",
      });
      // Reset form
      setCampaignName("");
      setMessage("Hi {{name}}, here's a special offer just for you!");
      setRules([{ id: "1", field: "totalSpent", operator: "gt", value: "10000" }]);
      setAudienceSize(0);
      // Invalidate campaigns cache
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: () => {
      toast({
        title: "Campaign creation failed",
        description: "Unable to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addRule = () => {
    setRules([...rules, { 
      id: Date.now().toString(), 
      field: "totalSpent", 
      operator: "gt", 
      value: "0" 
    }]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const updateRule = (id: string, field: string, value: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const handleCalculateAudience = () => {
    const segmentRules = rules.map(rule => ({
      field: rule.field,
      operator: rule.operator,
      value: rule.value
    }));
    calculateAudienceSize(segmentRules);
  };

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) {
      toast({
        title: "Campaign name required",
        description: "Please enter a campaign name",
        variant: "destructive",
      });
      return;
    }
    createCampaign();
  };

  return (
    <Card className="campaign-builder">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Create New Campaign</CardTitle>
            <p className="text-sm text-muted-foreground">Build targeted audience segments with AI-powered rules</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" title="AI Assistant">
              <Bot className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Save Draft">
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Campaign Name */}
        <div>
          <Label htmlFor="campaignName" className="text-sm font-medium">Campaign Name</Label>
          <Input
            id="campaignName"
            placeholder="e.g., Black Friday Sale - High Value Customers"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* AI Natural Language Input */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Bot className="w-4 h-4 text-purple-600" />
            <Label className="text-sm font-medium text-purple-900">AI Segment Builder</Label>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">Beta</Badge>
          </div>
          <Textarea
            placeholder="Describe your target audience in plain English, e.g., 'Customers who spent over ₹10,000 last month but haven't purchased in 2 weeks'"
            value={naturalLanguage}
            onChange={(e) => setNaturalLanguage(e.target.value)}
            className="border-purple-300 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
          />
          <Button
            onClick={() => convertToRules(naturalLanguage)}
            disabled={!naturalLanguage.trim() || isConverting}
            className="mt-3 bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Bot className="w-4 h-4 mr-2" />
            {isConverting ? "Converting..." : "Convert to Rules"}
          </Button>
        </div>

        {/* Manual Rule Builder */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Audience Rules</Label>
            <Button
              onClick={addRule}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Rule
            </Button>
          </div>

          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div key={rule.id} className="rule-group">
                <div className="flex items-center space-x-3">
                  <Select
                    value={rule.field}
                    onValueChange={(value) => updateRule(rule.id, "field", value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="totalSpent">Total Spent</SelectItem>
                      <SelectItem value="visitCount">Visit Count</SelectItem>
                      <SelectItem value="lastVisit">Last Visit</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={rule.operator}
                    onValueChange={(value) => updateRule(rule.id, "operator", value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gt">Greater than</SelectItem>
                      <SelectItem value="lt">Less than</SelectItem>
                      <SelectItem value="eq">Equal to</SelectItem>
                      <SelectItem value="gte">Greater than or equal</SelectItem>
                      <SelectItem value="lte">Less than or equal</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Value"
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, "value", e.target.value)}
                    className="flex-1"
                  />

                  {rules.length > 1 && (
                    <Button
                      onClick={() => removeRule(rule.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {index < rules.length - 1 && (
                  <div className="flex justify-center mt-3">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">AND</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message Template */}
        <div>
          <Label htmlFor="message" className="text-sm font-medium">Campaign Message</Label>
          <Textarea
            id="message"
            placeholder="Hi {{name}}, here's a special offer just for you!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use {"{{name}}"} to personalize with customer names
          </p>
        </div>

        {/* Audience Preview */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Estimated Audience Size</p>
              <p className="text-2xl font-semibold text-green-700">
                {audienceSize.toLocaleString()} customers
              </p>
            </div>
            <div className="text-green-600">
              <Users className="w-8 h-8" />
            </div>
          </div>
          <Button
            onClick={handleCalculateAudience}
            disabled={isCalculating}
            variant="ghost"
            size="sm"
            className="mt-3 text-green-700 hover:text-green-800"
          >
            <Users className="w-4 h-4 mr-1" />
            {isCalculating ? "Calculating..." : "Recalculate Size"}
          </Button>
        </div>

        {/* Campaign Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={handleCreateCampaign}
            disabled={isCreating || !campaignName.trim()}
            className="flex-1"
          >
            <Rocket className="w-4 h-4 mr-2" />
            {isCreating ? "Creating..." : "Create & Launch Campaign"}
          </Button>
          <Button variant="outline">
            Save Draft
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
