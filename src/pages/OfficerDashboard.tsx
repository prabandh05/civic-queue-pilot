import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TokenCard } from "@/components/queue/TokenCard";
import { QueueStats } from "@/components/queue/QueueStats";
import { useQueue } from "@/hooks/use-queue";
import { useToast } from "@/hooks/use-toast";
import { Token } from "@/types/queue";
import { ArrowLeft, Search, Play, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

export const OfficerDashboard = () => {
  const { tokens, stats, counters, updateTokenStatus } = useQueue();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCounter, setSelectedCounter] = useState<string>("1");

  const handleStatusUpdate = (token: Token, newStatus: Token['status']) => {
    const counterNumber = newStatus === 'serving' ? parseInt(selectedCounter) : undefined;
    updateTokenStatus(token.id, newStatus, counterNumber);
    
    const statusMessages = {
      serving: `Token #${token.number} is now being served at Counter ${counterNumber}`,
      completed: `Token #${token.number} has been completed`,
      'no-show': `Token #${token.number} marked as no-show`
    };
    
    toast({
      title: "Status Updated",
      description: statusMessages[newStatus],
    });
  };

  const filteredTokens = tokens.filter(token => 
    token.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.citizenId.includes(searchTerm) ||
    token.id.includes(searchTerm) ||
    token.number.toString().includes(searchTerm)
  );

  const waitingTokens = filteredTokens.filter(t => t.status === 'waiting');
  const servingTokens = filteredTokens.filter(t => t.status === 'serving');
  const completedTokens = filteredTokens.filter(t => t.status === 'completed').slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Officer Dashboard</h1>
                <p className="text-muted-foreground">Regional Transport Office - Queue Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedCounter} onValueChange={setSelectedCounter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {counters.map((counter) => (
                    <SelectItem key={counter.id} value={counter.id.toString()}>
                      {counter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Queue Statistics */}
        <QueueStats stats={stats} />

        {/* Search and Controls */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or token number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </Card>

        {/* Currently Serving */}
        {servingTokens.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Currently Being Served</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servingTokens.map((token) => (
                <div key={token.id} className="space-y-2">
                  <TokenCard token={token} />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(token, 'completed')}
                      className="flex-1 gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(token, 'no-show')}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      No Show
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiting Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Waiting Queue ({waitingTokens.length})</h2>
            <div className="text-sm text-muted-foreground">
              Counter {selectedCounter} selected for new calls
            </div>
          </div>
          
          {waitingTokens.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No tokens waiting in queue</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingTokens.map((token) => (
                <div key={token.id} className="space-y-2">
                  <TokenCard token={token} />
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(token, 'serving')}
                    className="w-full gap-1"
                  >
                    <Play className="h-4 w-4" />
                    Call for Service
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Completed */}
        {completedTokens.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recently Completed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {completedTokens.map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;