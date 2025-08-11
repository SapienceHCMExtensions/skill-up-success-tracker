import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BaseText { key: string; text: string }

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { base_language_code, target_language_code, base_texts } = await req.json() as { base_language_code: string; target_language_code: string; base_texts: BaseText[] };
    if (!base_language_code || !target_language_code || !Array.isArray(base_texts)) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const prompt = `You are a localization assistant. Translate the provided key->text pairs from ${base_language_code} to ${target_language_code}. Preserve placeholders like {name} or {{var}}. Return strictly JSON mapping of keys to translated values, no explanation. Keys: ${JSON.stringify(base_texts)}`;

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Gemini API error', details: data }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    let mapping: Record<string, string> = {};
    try {
      mapping = JSON.parse(text);
    } catch {
      // try to extract JSON
      const match = text.match(/\{[\s\S]*\}/);
      if (match) mapping = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({ translations: mapping }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('translate-with-gemini error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});