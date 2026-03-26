import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { audio_base64 } = await req.json();

    if (!audio_base64) {
      return new Response(
        JSON.stringify({ error: "audio_base64 is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY not configured. Voice transcription is not available.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convertir base64 a archivo
    const binaryData = Uint8Array.from(atob(audio_base64), (c) =>
      c.charCodeAt(0)
    );
    const audioBlob = new Blob([binaryData], { type: "audio/wav" });

    // Crear FormData para Whisper API
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "whisper-1");
    formData.append("language", "es"); // Español

    // Llamar a OpenAI Whisper API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Whisper API error:", errorData);
      return new Response(
        JSON.stringify({
          error: errorData.error?.message || "Failed to transcribe audio",
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();

    return new Response(JSON.stringify({ text: result.text }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Transcribe error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Transcription failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
