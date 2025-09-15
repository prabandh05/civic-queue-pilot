import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import QRCode from 'qrcode';

interface Token {
  id: string;
  token_number: number;
  citizen_id: string;
  citizen_name: string;
  citizen_phone: string;
  service_type: string;
  time_slot: string;
  estimated_time: string;
  status: 'waiting' | 'serving' | 'completed' | 'no-show' | 'cancelled';
  priority: boolean;
  counter_id?: number;
  qr_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface QueueStats {
  totalTokens: number;
  currentlyServing: number;
  averageWaitTime: number;
  completedToday: number;
}

interface Counter {
  id: number;
  name: string;
  officer_id?: string;
  officer_name?: string;
  is_active: boolean;
  services: string[];
}

export const useQueueData = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    totalTokens: 0,
    currentlyServing: 0,
    averageWaitTime: 0,
    completedToday: 0
  });
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchTokens();
    fetchCounters();
    fetchStats();

    // Subscribe to real-time updates
    const tokensSubscription = supabase
      .channel('tokens-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, () => {
        fetchTokens();
        fetchStats();
      })
      .subscribe();

    const countersSubscription = supabase
      .channel('counters-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counters' }, () => {
        fetchCounters();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tokensSubscription);
      supabase.removeChannel(countersSubscription);
    };
  }, []);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select(`
          *,
          profiles!tokens_citizen_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedTokens = data.map((token: any) => ({
        ...token,
        citizen_name: token.profiles?.full_name || 'Unknown',
        citizen_phone: token.profiles?.phone || '',
        time_slot: new Date(token.time_slot).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));

      setTokens(formattedTokens);
    } catch (error: any) {
      console.error('Error fetching tokens:', error);
      toast({
        title: "Error",
        description: "Failed to load tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCounters = async () => {
    try {
      const { data, error } = await supabase
        .from('counters')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) throw error;
      setCounters(data || []);
    } catch (error: any) {
      console.error('Error fetching counters:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayTokens, error } = await supabase
        .from('tokens')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (error) throw error;

      const totalTokens = todayTokens?.length || 0;
      const currentlyServing = todayTokens?.filter(t => t.status === 'serving').length || 0;
      const completedToday = todayTokens?.filter(t => t.status === 'completed').length || 0;

      setStats({
        totalTokens,
        currentlyServing,
        averageWaitTime: 25, // Calculate based on actual wait times
        completedToday
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateToken = async (citizenId: string, serviceType: string = 'general'): Promise<Token | null> => {
    try {
      // Get token number
      const { data: tokenNumber, error: numberError } = await supabase
        .rpc('generate_token_number');

      if (numberError) throw numberError;

      // Calculate time slot (10 minutes per token)
      const now = new Date();
      const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0); // Start at 9 AM
      const timeSlot = new Date(baseTime.getTime() + (tokenNumber - 1) * 10 * 60 * 1000);

      // Generate QR code
      const qrData = JSON.stringify({
        tokenNumber,
        citizenId,
        timeSlot: timeSlot.toISOString()
      });
      const qrCode = await QRCode.toDataURL(qrData);

      const { data, error } = await supabase
        .from('tokens')
        .insert({
          token_number: tokenNumber,
          citizen_id: citizenId,
          citizen_name: profile?.full_name || 'Unknown',
          citizen_phone: profile?.phone || '',
          service_type: serviceType,
          time_slot: timeSlot.toISOString(),
          estimated_time: `${(tokenNumber - (stats.currentlyServing || 1)) * 10} mins`,
          qr_code: qrCode
        })
        .select(`
          *,
          profiles!tokens_citizen_id_fkey(full_name, phone)
        `)
        .single();

      if (error) throw error;

      const newToken = {
        ...data,
        citizen_name: data.profiles?.full_name || 'Unknown',
        citizen_phone: data.profiles?.phone || '',
        time_slot: new Date(data.time_slot).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      } as Token;

      // Send SMS notification
      try {
        await supabase.functions.invoke('send-sms-notification', {
          body: {
            tokenId: newToken.id,
            phone: newToken.citizen_phone,
            type: 'token_created'
          }
        });
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }

      toast({
        title: "Token Generated",
        description: `Token #${tokenNumber} has been generated successfully!`,
      });

      return newToken;
    } catch (error: any) {
      console.error('Error generating token:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate token",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTokenStatus = async (tokenId: string, status: Token['status'], counterId?: number) => {
    try {
      const updateData: any = {
        status,
        counter_id: counterId,
        updated_at: new Date().toISOString()
      };

      if (status === 'serving') {
        updateData.called_at = new Date().toISOString();
        updateData.served_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tokens')
        .update(updateData)
        .eq('id', tokenId);

      if (error) throw error;

      // Send SMS notification for status updates
      if (status === 'serving' || status === 'completed') {
        try {
          await supabase.functions.invoke('send-sms-notification', {
            body: {
              tokenId,
              type: status === 'serving' ? 'token_called' : 'token_completed'
            }
          });
        } catch (smsError) {
          console.error('SMS notification failed:', smsError);
        }
      }

      toast({
        title: "Status Updated",
        description: `Token status updated to ${status}`,
      });
    } catch (error: any) {
      console.error('Error updating token status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update token status",
        variant: "destructive"
      });
    }
  };

  return {
    tokens,
    stats,
    counters,
    loading,
    generateToken,
    updateTokenStatus,
    refreshData: () => {
      fetchTokens();
      fetchCounters();
      fetchStats();
    }
  };
};