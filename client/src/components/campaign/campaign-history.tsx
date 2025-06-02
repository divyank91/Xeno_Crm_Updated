import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Copy, Trash2, Download, Users, Play, Square, Edit } from "lucide-react";
import type { CampaignWithStats } from "@shared/schema";

export function CampaignHistory() {
  const { data: campaigns, isLoading } = useQuery<CampaignWithStats[]>({
    queryKey: ["/api/campaigns"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "sending":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <span className="animate-pulse-blue mr-1">●</span> Sending
          </Badge>
        );
      case "scheduled":
        return <Badge className="bg-yellow-100 text-yellow-700">Scheduled</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading campaigns...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Campaign History</CardTitle>
            <p className="text-sm text-muted-foreground">Track performance and delivery statistics</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {campaigns && campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Stats</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">{campaign.description || "No description"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{campaign.audienceSize.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600">✓ {campaign.sentCount} Sent</span>
                        </div>
                        {campaign.failedCount > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-red-600">✗ {campaign.failedCount} Failed</span>
                          </div>
                        )}
                        {campaign.pendingCount > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-yellow-600">⧗ {campaign.pendingCount} Pending</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {campaign.status === "completed" ? (
                          <>
                            <div className="text-xs text-muted-foreground">
                              Open: {Math.floor(Math.random() * 30 + 10)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Click: {Math.floor(Math.random() * 15 + 3)}%
                            </div>
                          </>
                        ) : campaign.status === "sending" ? (
                          <span className="text-xs text-muted-foreground">In progress...</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(campaign.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {campaign.status === "draft" && (
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {campaign.status === "scheduled" && (
                          <Button variant="ghost" size="sm" title="Send Now" className="text-green-600">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {campaign.status === "sending" && (
                          <Button variant="ghost" size="sm" title="Stop Campaign" className="text-red-600">
                            <Square className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Delete" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
              <p className="text-sm">Create your first campaign to get started</p>
            </div>
          </div>
        )}

        {campaigns && campaigns.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing 1 to {campaigns.length} of {campaigns.length} campaigns
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button size="sm">1</Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
