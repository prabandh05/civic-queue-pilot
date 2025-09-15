import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenCard } from "@/components/queue/TokenCard";
import { QueueStats } from "@/components/queue/QueueStats";
import { useQueue } from "@/hooks/use-queue";
import { useToast } from "@/hooks/use-toast";
import { Token } from "@/types/queue";
import { ArrowLeft, Plus, Bell, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export const CitizenDashboard = () => {
  const { tokens, stats, generateToken } = useQueue();
  const { toast } = useToast();
  const [citizenName, setCitizenName] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [userToken, setUserToken] = useState<Token | null>(null);
  const [showTokenForm, setShowTokenForm] = useState(false);

  const handleGenerateToken = () => {
    if (!citizenName.trim() || !citizenId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and ID number.",
        variant: "destructive"
      });
      return;
    }

    const newToken = generateToken(citizenName, citizenId);
    setUserToken(newToken);
    setShowTokenForm(false);
    setCitizenName("");
    setCitizenId("");
    
    toast({
      title: "Token Generated Successfully!",
      description: `Your token number is #${newToken.number}. Estimated wait time: ${newToken.estimatedTime}`,
    });
  };

  const currentlyServing = tokens.filter(t => t.status === 'serving');
  const nextInQueue = tokens.filter(t => t.status === 'waiting').slice(0, 5);

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
                <h1 className="text-2xl font-bold text-foreground">Citizen Portal</h1>
                <p className="text-muted-foreground">Regional Transport Office - Queue System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Queue Statistics */}
        <QueueStats stats={stats} />

        {/* User's Token Section */}
        {userToken ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Token</h2>
            <TokenCard token={userToken} isCurrentUser={true} />
            
            {userToken.status === 'waiting' && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-primary">Queue Status Update</p>
                    <p className="text-sm text-muted-foreground">
                      You are #{userToken.number - currentlyServing.length - tokens.filter(t => t.status === 'completed').length} in line. 
                      We'll notify you when it's almost your turn.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Get Your Queue Token</h2>
              <p className="text-muted-foreground">
                Generate a token to join the queue and track your position in real-time.
              </p>
              
              {!showTokenForm ? (
                <Button onClick={() => setShowTokenForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Get Token
                </Button>
              ) : (
                <div className="max-w-md mx-auto space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="id">Aadhaar/ID Number</Label>
                    <Input
                      id="id"
                      placeholder="XXXX-XXXX-XXXX"
                      value={citizenId}
                      onChange={(e) => setCitizenId(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleGenerateToken} className="flex-1">
                      Generate Token
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowTokenForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Currently Being Served */}
        {currentlyServing.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Currently Being Served</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentlyServing.map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          </div>
        )}

        {/* Next in Queue */}
        {nextInQueue.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Next in Queue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nextInQueue.map((token) => (
                <TokenCard key={token.id} token={token} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;