import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tokenId, phone, type } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get token details
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .select(`
        *,
        profiles!tokens_citizen_id_fkey(full_name, phone)
      `)
      .eq('id', tokenId)
      .single();

    if (tokenError) throw tokenError;

    // Prepare SMS message based on type
    let message = '';
    const tokenNumber = token.token_number;
    const citizenName = token.profiles?.full_name || 'Citizen';
    
    switch (type) {
      case 'token_created':
        message = `Hi ${citizenName}, your token #${tokenNumber} has been generated. Expected time: ${token.estimated_time}. RTO Queue Management`;
        break;
      case 'token_called':
        message = `Hi ${citizenName}, your token #${tokenNumber} is now being called for service at Counter ${token.counter_id}. Please proceed immediately.`;
        break;
      case 'token_completed':
        message = `Hi ${citizenName}, your service for token #${tokenNumber} has been completed. Thank you for visiting RTO.`;
        break;
      case 'reminder':
        message = `Hi ${citizenName}, reminder: Your token #${tokenNumber} will be called soon. Please be ready.`;
        break;
      default:
        throw new Error('Invalid notification type');
    }

    // Send SMS using Twilio
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = '+1234567890'; // Replace with your Twilio phone number

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new FormData();
    formData.append('To', phone || token.profiles?.phone);
    formData.append('From', twilioPhone);
    formData.append('Body', message);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Twilio error: ${result.message}`);
    }

    // Log notification in database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        token_id: tokenId,
        type: 'sms',
        status: 'sent',
        message,
        sent_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Failed to log notification:', notificationError);
    }

    console.log('SMS sent successfully:', result.sid);

    return new Response(
      JSON.stringify({ success: true, sid: result.sid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-sms-notification:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});