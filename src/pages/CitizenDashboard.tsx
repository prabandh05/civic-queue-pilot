import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TokenCard } from "@/components/queue/TokenCard";
import { QueueStats } from "@/components/queue/QueueStats";
import { QRCodeDisplay } from "@/components/queue/QRCodeDisplay";
import { useQueueData } from "@/hooks/use-queue-data";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, QrCode, Download, Bell, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export const CitizenDashboard = () => {
  const { tokens, stats, generateToken, loading } = useQueueData();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [serviceType, setServiceType] = useState("general");
  const [showTokenForm, setShowTokenForm] = useState(false);

  // Get current user's tokens
  const userTokens = tokens.filter(token => 
    token.citizen_id === profile?.id
  );

  const handleGenerateToken = async () => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate a token",
        variant: "destructive",
      });
      return;
    }

    const newToken = await generateToken(profile.id, serviceType);
    if (newToken) {
      setShowTokenForm(false);
      setServiceType("general");
    }
  };

  const downloadQRCode = (token: any) => {
    if (token.qr_code) {
      const link = document.createElement('a');
      link.download = `token-${token.token_number}-qr.png`;
      link.href = token.qr_code;
      link.click();
    }
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
                {profile && (
                  <p className="text-sm text-muted-foreground">Welcome, {profile.full_name}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Queue Statistics */}
        <QueueStats stats={stats} />

        {/* Token Generation */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Generate New Token</h2>
            <Button onClick={() => setShowTokenForm(!showTokenForm)} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              New Token
            </Button>
          </div>

          {showTokenForm && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <label htmlFor="service" className="text-sm font-medium">Service Type</label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Service</SelectItem>
                    <SelectItem value="license">Driving License</SelectItem>
                    <SelectItem value="registration">Vehicle Registration</SelectItem>
                    <SelectItem value="renewal">License Renewal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleGenerateToken} className="flex-1" disabled={loading}>
                  Generate Token
                </Button>
                <Button variant="outline" onClick={() => setShowTokenForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Your Tokens */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Tokens</h2>
          {userTokens.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No tokens generated yet. Generate a token to join the queue.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userTokens.map((token) => (
                <div key={token.id} className="space-y-2">
                  <TokenCard token={{
                    ...token,
                    number: token.token_number,
                    citizenName: token.citizen_name,
                    citizenId: token.citizen_phone,
                    timeSlot: token.time_slot,
                    estimatedTime: token.estimated_time,
                    createdAt: new Date(token.created_at)
                  }} isCurrentUser={true} />
                  
                  {token.qr_code && (
                    <div className="flex gap-2">
                      <QRCodeDisplay token={token} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadQRCode(token)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download QR
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currently Being Served */}
        {currentlyServing.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Currently Being Served</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentlyServing.map((token) => (
                <TokenCard key={token.id} token={{
                  ...token,
                  number: token.token_number,
                  citizenName: token.citizen_name,
                  citizenId: token.citizen_phone,
                  timeSlot: token.time_slot,
                  estimatedTime: token.estimated_time,
                  createdAt: new Date(token.created_at)
                }} />
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
                <TokenCard key={token.id} token={{
                  ...token,
                  number: token.token_number,
                  citizenName: token.citizen_name,
                  citizenId: token.citizen_phone,
                  timeSlot: token.time_slot,
                  estimatedTime: token.estimated_time,
                  createdAt: new Date(token.created_at)
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};