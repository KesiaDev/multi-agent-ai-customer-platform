import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.85.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  conversationId: string;
  content?: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  mediaUrl?: string;
  mediaBase64?: string;
  mediaMimetype?: string;
  fileName?: string;
  quotedMessageId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: SendMessageRequest = await req.json();
    console.log('[send-whatsapp-message] Request received:', { 
      conversationId: body.conversationId, 
      messageType: body.messageType 
    });

    // Validate request
    if (!body.conversationId || !body.messageType) {
      return new Response(
        JSON.stringify({ success: false, error: 'conversationId and messageType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.messageType === 'text' && !body.content) {
      return new Response(
        JSON.stringify({ success: false, error: 'content is required for text messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.messageType !== 'text' && !body.mediaUrl && !body.mediaBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'mediaUrl or mediaBase64 is required for media messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation details including instance info
    const { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select(`
        *,
        whatsapp_contacts!inner (
          phone_number,
          name
        ),
        whatsapp_instances!inner (
          id,
          instance_name,
          provider_type,
          instance_id_external
        )
      `)
      .eq('id', body.conversationId)
      .single();

    if (convError || !conversation) {
      console.error('[send] Conversation not found:', convError);
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch instance secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('whatsapp_instance_secrets')
      .select('api_url, api_key')
      .eq('instance_id', (conversation as any).whatsapp_instances.id)
      .single();

    if (secretsError || !secrets) {
      console.error('[send] Failed to fetch instance secrets:', secretsError);
      return new Response(JSON.stringify({ error: 'Instance secrets not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const instanceName = (conversation as any).whatsapp_instances.instance_name;
    const providerType = (conversation as any).whatsapp_instances.provider_type || 'self_hosted';
    const instanceIdExternal = (conversation as any).whatsapp_instances.instance_id_external;
    const contact = (conversation as any).whatsapp_contacts;

    console.log('[send-whatsapp-message] Sending to:', contact.phone_number, 'Provider:', providerType);

    const destinationNumber = getDestinationNumber(contact.phone_number);

    let baseUrl = secrets.api_url.endsWith('/') ? secrets.api_url.slice(0, -1) : secrets.api_url;
    baseUrl = baseUrl.replace(/\/manager$/, '');

    // Detect if this is Evolution GO by checking if /send/text route exists
    const isEvolutionGO = await detectEvolutionGO(baseUrl, secrets.api_key);
    console.log('[send-whatsapp-message] Is Evolution GO:', isEvolutionGO);

    let endpoint: string;
    let requestBody: any;
    let authHeaders: Record<string, string>;

    if (isEvolutionGO) {
      // Evolution GO: uses instance token for auth & different routes (/send/*)
      const instanceToken = await getEvolutionGOInstanceToken(baseUrl, secrets.api_key, instanceName);
      if (!instanceToken) {
        return new Response(
          JSON.stringify({ success: false, error: 'Could not retrieve instance token from Evolution GO' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      authHeaders = { apikey: instanceToken };
      const result = buildEvolutionGORequest(baseUrl, destinationNumber, body);
      endpoint = result.endpoint;
      requestBody = result.requestBody;
    } else {
      // Standard Evolution API: uses global API key & /message/* routes
      const instanceIdentifier = providerType === 'cloud' && instanceIdExternal
        ? instanceIdExternal
        : instanceName;
      authHeaders = { apikey: secrets.api_key };
      const result = buildEvolutionAPIRequest(baseUrl, instanceIdentifier, destinationNumber, body);
      endpoint = result.endpoint;
      requestBody = result.requestBody;
    }

    console.log('[send-whatsapp-message] Endpoint:', endpoint);

    // Send to Evolution API
    const evolutionResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(requestBody),
    });

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text();
      console.error('[send-whatsapp-message] Evolution API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send message via Evolution API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evolutionData = await evolutionResponse.json();
    console.log('[send-whatsapp-message] Evolution API response:', JSON.stringify(evolutionData).substring(0, 500));

    // Extract message ID - Evolution GO uses different response structure
    let messageId: string;
    if (isEvolutionGO) {
      messageId = evolutionData.data?.Info?.ID || evolutionData.key?.id || `msg_${Date.now()}`;
    } else {
      messageId = evolutionData.key?.id || `msg_${Date.now()}`;
    }

    // Extract media URL from response
    let extractedMediaUrl: string | null = null;
    if (body.messageType === 'audio' && evolutionData.message?.audioMessage?.url) {
      extractedMediaUrl = evolutionData.message.audioMessage.url;
    } else if (body.messageType === 'image' && evolutionData.message?.imageMessage?.url) {
      extractedMediaUrl = evolutionData.message.imageMessage.url;
    } else if (body.messageType === 'video' && evolutionData.message?.videoMessage?.url) {
      extractedMediaUrl = evolutionData.message.videoMessage.url;
    } else if (body.messageType === 'document' && evolutionData.message?.documentMessage?.url) {
      extractedMediaUrl = evolutionData.message.documentMessage.url;
    }

    // Save message to database
    const messageContent = body.messageType === 'text' 
      ? (body.content || '') 
      : (body.content || `Sent ${body.messageType}`);

    const { data: savedMessage, error: saveError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: body.conversationId,
        message_id: messageId,
        remote_jid: contact.phone_number,
        content: messageContent,
        message_type: body.messageType,
        media_url: extractedMediaUrl || body.mediaUrl || null,
        media_mimetype: body.mediaMimetype || null,
        status: 'sent',
        is_from_me: true,
        timestamp: new Date().toISOString(),
        quoted_message_id: body.quotedMessageId || null,
        metadata: {
          fileName: body.fileName,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('[send-whatsapp-message] Error saving message:', saveError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update conversation metadata
    await supabase
      .from('whatsapp_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: messageContent.substring(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.conversationId);

    console.log('[send-whatsapp-message] Message sent and saved:', savedMessage.id);

    return new Response(
      JSON.stringify({ success: true, message: savedMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-whatsapp-message] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Cache for Evolution GO detection and instance tokens (per function invocation)
const evolutionGOCache = new Map<string, boolean>();
const instanceTokenCache = new Map<string, string>();

async function detectEvolutionGO(baseUrl: string, apiKey: string): Promise<boolean> {
  if (evolutionGOCache.has(baseUrl)) return evolutionGOCache.get(baseUrl)!;
  
  try {
    // Try the /instance/all route with the global key
    // Evolution GO returns JSON with data array; standard Evolution API also supports this
    // But Evolution GO has /send/* routes while standard has /message/sendText/*
    // We detect by checking if /swagger/doc.json exists (Evolution GO specific)
    const res = await fetch(`${baseUrl}/swagger/doc.json`, { 
      method: 'GET',
      headers: { apikey: apiKey },
    });
    const isGO = res.ok;
    evolutionGOCache.set(baseUrl, isGO);
    return isGO;
  } catch {
    evolutionGOCache.set(baseUrl, false);
    return false;
  }
}

async function getEvolutionGOInstanceToken(baseUrl: string, globalApiKey: string, instanceName: string): Promise<string | null> {
  const cacheKey = `${baseUrl}:${instanceName}`;
  if (instanceTokenCache.has(cacheKey)) return instanceTokenCache.get(cacheKey)!;

  try {
    const res = await fetch(`${baseUrl}/instance/all`, {
      headers: { apikey: globalApiKey },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const instances = data?.data || data || [];
    const instance = Array.isArray(instances) 
      ? instances.find((i: any) => i.name === instanceName)
      : null;

    if (instance?.token) {
      instanceTokenCache.set(cacheKey, instance.token);
      return instance.token;
    }
    return null;
  } catch (e) {
    console.error('[send] Error fetching instance token:', e);
    return null;
  }
}

function getDestinationNumber(phoneNumber: string): string {
  if (phoneNumber.includes('@lid')) {
    return phoneNumber;
  }
  return phoneNumber.replace(/\D/g, '');
}

// Evolution GO routes (/send/*)
function buildEvolutionGORequest(
  baseUrl: string,
  number: string,
  body: SendMessageRequest
): { endpoint: string; requestBody: any } {
  switch (body.messageType) {
    case 'text': {
      const requestBody: any = { number, text: body.content };
      if (body.quotedMessageId) {
        requestBody.quoted = { key: { id: body.quotedMessageId } };
      }
      return { endpoint: `${baseUrl}/send/text`, requestBody };
    }

    case 'audio': {
      let audioData: string | undefined;
      if (body.mediaBase64) {
        audioData = body.mediaBase64.startsWith('data:')
          ? body.mediaBase64.split(',')[1] || ''
          : body.mediaBase64;
      } else if (body.mediaUrl) {
        audioData = body.mediaUrl;
      }
      if (!audioData) throw new Error('Missing audio data');
      
      return {
        endpoint: `${baseUrl}/send/media`,
        requestBody: { number, url: audioData, type: 'audio', caption: '' },
      };
    }

    case 'image':
    case 'video':
    case 'document': {
      const requestBody: any = {
        number,
        url: body.mediaBase64 || body.mediaUrl,
        type: body.messageType,
      };
      if (body.content) requestBody.caption = body.content;
      if (body.messageType === 'document' && body.fileName) {
        requestBody.filename = body.fileName;
      }
      return { endpoint: `${baseUrl}/send/media`, requestBody };
    }

    default:
      throw new Error(`Unsupported message type: ${body.messageType}`);
  }
}

// Standard Evolution API routes (/message/*)
function buildEvolutionAPIRequest(
  baseUrl: string,
  instanceName: string,
  number: string,
  body: SendMessageRequest
): { endpoint: string; requestBody: any } {
  switch (body.messageType) {
    case 'text': {
      const requestBody: any = { number, text: body.content };
      if (body.quotedMessageId) {
        requestBody.quoted = { key: { id: body.quotedMessageId } };
      }
      return { endpoint: `${baseUrl}/message/sendText/${instanceName}`, requestBody };
    }

    case 'audio': {
      let audioData: string | undefined;
      if (body.mediaBase64) {
        audioData = body.mediaBase64.startsWith('data:')
          ? body.mediaBase64.split(',')[1] || ''
          : body.mediaBase64;
      } else if (body.mediaUrl) {
        audioData = body.mediaUrl;
      }
      if (!audioData) throw new Error('Missing audio data');

      return {
        endpoint: `${baseUrl}/message/sendWhatsAppAudio/${instanceName}`,
        requestBody: { number, audio: audioData },
      };
    }

    case 'image':
    case 'video':
    case 'document': {
      const requestBody: any = {
        number,
        mediatype: body.messageType,
        media: body.mediaBase64 || body.mediaUrl,
      };
      if (body.content) requestBody.caption = body.content;
      if (body.messageType === 'document' && body.fileName) {
        requestBody.fileName = body.fileName;
      }
      return { endpoint: `${baseUrl}/message/sendMedia/${instanceName}`, requestBody };
    }

    default:
      throw new Error(`Unsupported message type: ${body.messageType}`);
  }
}
