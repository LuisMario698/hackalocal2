import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Extract address from text ────────────────────────────────────────
function extractAddress(text: string): string | null {
  const patterns = [
    /\b(calle|avenida|av\.?|blvd\.?|boulevard|carretera|camino|cerrada|privada)\s+[\w\s\d]+(?=[.,!?]|$)/gi,
    /\bentre\s+[\w\s\d]+\s+y\s+[\w\s\d]+/gi,
    /\b\d+\.\d+,\s*-?\d+\.\d+\b/g,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

// ── System prompts por rol ──────────────────────────────────────────
const SYSTEM_PROMPTS: Record<string, string> = {
  client: `Eres un asistente amigable de la app Social Clean.
Ayudas a ciudadanos a reportar problemas en su comunidad,
consultar el estado de sus reportes, ver sus eco-puntos y
canjear recompensas. Siempre responde en español, de forma
breve y clara. Cuando el usuario quiera crear un reporte,
recopila la información necesaria paso a paso (tipo de problema,
descripción breve) y confirma antes de crearlo. Nunca inventes
fechas de atención ni prometas tiempos de resolución.`,

  association: `Eres un asistente de gestión para asociaciones en Social Clean.
Ayudas a crear y gestionar servicios comunitarios, ver voluntarios
inscritos, consultar reportes verificados en la zona y publicar
en el feed. Responde en español de forma profesional y concisa.
Cuando crees un servicio, pide: título, descripción, fecha/hora,
dirección, puntos de recompensa para voluntarios y máximo de
participantes. Confirma antes de guardar.`,

  admin: `Eres el asistente de administración de Social Clean.
Puedes verificar o rechazar reportes, consultar estadísticas
generales, gestionar recompensas y ver el leaderboard.
Responde en español. Para acciones destructivas o irreversibles
(rechazar reporte, eliminar) siempre pide confirmación explícita.`,
};

// ── Tool definitions por rol ────────────────────────────────────────
const CLIENT_TOOLS = [
  {
    name: "crear_reporte_borrador",
    description:
      "Crea un borrador de reporte en ai_content_drafts. NO inserta en reports todavía, espera confirmación.",
    input_schema: {
      type: "object" as const,
      properties: {
        titulo: { type: "string", description: "Título del reporte" },
        descripcion: { type: "string", description: "Descripción del problema" },
        categoria: {
          type: "string",
          enum: ["trash", "pothole", "drain", "water", "wildlife", "electronic", "organic", "other"],
          description: "Categoría del reporte",
        },
        severidad: { type: "number", description: "Severidad del 1 al 5" },
      },
      required: ["titulo", "descripcion", "categoria", "severidad"],
    },
  },
  {
    name: "confirmar_reporte",
    description: "Confirma y crea el reporte real a partir de un borrador.",
    input_schema: {
      type: "object" as const,
      properties: {
        draft_id: { type: "string", description: "ID del borrador a confirmar" },
      },
      required: ["draft_id"],
    },
  },
  {
    name: "consultar_mis_reportes",
    description: "Consulta los últimos 5 reportes del usuario actual.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filtro opcional de status" },
      },
    },
  },
  {
    name: "consultar_mis_puntos",
    description: "Consulta eco-puntos, nivel, racha y estadísticas del usuario.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "consultar_recompensas",
    description: "Lista las recompensas activas disponibles para canjear.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "consultar_mis_notificaciones",
    description: "Muestra las notificaciones no leídas del usuario.",
    input_schema: { type: "object" as const, properties: {} },
  },
];

const ASSOCIATION_TOOLS = [
  {
    name: "crear_servicio_borrador",
    description: "Crea un borrador de servicio comunitario.",
    input_schema: {
      type: "object" as const,
      properties: {
        titulo: { type: "string" },
        descripcion: { type: "string" },
        puntos_recompensa: { type: "number" },
        max_voluntarios: { type: "number" },
        direccion: { type: "string" },
        fecha_programada: { type: "string", description: "Fecha ISO 8601" },
      },
      required: ["titulo", "descripcion", "puntos_recompensa", "max_voluntarios", "direccion", "fecha_programada"],
    },
  },
  {
    name: "confirmar_servicio",
    description: "Confirma y crea el servicio comunitario a partir de un borrador.",
    input_schema: {
      type: "object" as const,
      properties: {
        draft_id: { type: "string" },
      },
      required: ["draft_id"],
    },
  },
  {
    name: "ver_voluntarios_servicio",
    description: "Muestra los voluntarios inscritos en un servicio.",
    input_schema: {
      type: "object" as const,
      properties: {
        service_id: { type: "string" },
      },
      required: ["service_id"],
    },
  },
  {
    name: "ver_reportes_verificados",
    description: "Lista los últimos 10 reportes verificados.",
    input_schema: { type: "object" as const, properties: {} },
  },
];

const ADMIN_TOOLS = [
  {
    name: "verificar_reporte",
    description: "Verifica un reporte pendiente (cambia status a verified).",
    input_schema: {
      type: "object" as const,
      properties: {
        report_id: { type: "string" },
      },
      required: ["report_id"],
    },
  },
  {
    name: "rechazar_reporte",
    description: "Rechaza un reporte pendiente con una razón.",
    input_schema: {
      type: "object" as const,
      properties: {
        report_id: { type: "string" },
        razon: { type: "string" },
      },
      required: ["report_id", "razon"],
    },
  },
  {
    name: "ver_estadisticas",
    description: "Muestra estadísticas generales del sistema.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "ver_leaderboard",
    description: "Muestra el top 10 del leaderboard mensual.",
    input_schema: { type: "object" as const, properties: {} },
  },
];

function getToolsForRole(role: string) {
  const tools = [...CLIENT_TOOLS];
  if (role === "association" || role === "admin") tools.push(...ASSOCIATION_TOOLS);
  if (role === "admin") tools.push(...ADMIN_TOOLS);
  return tools;
}

// ── Tool execution ──────────────────────────────────────────────────
async function executeTool(
  toolName: string,
  toolInput: Record<string, any>,
  userId: string,
  conversationId: string
): Promise<string> {
  try {
    switch (toolName) {
      case "crear_reporte_borrador": {
        const { data, error } = await supabase
          .from("ai_content_drafts")
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            draft_type: "report",
            content: {
              title: toolInput.titulo,
              description: toolInput.descripcion,
              category: toolInput.categoria,
              severity: toolInput.severidad,
            },
            is_accepted: false,
          })
          .select("id")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ draft_id: data.id, message: "Borrador creado" });
      }

      case "confirmar_reporte": {
        const { data: draft, error: draftErr } = await supabase
          .from("ai_content_drafts")
          .select("*")
          .eq("id", toolInput.draft_id)
          .eq("user_id", userId)
          .single();
        if (draftErr || !draft) return JSON.stringify({ error: "Borrador no encontrado" });

        const content = draft.content as any;
        // Extraer dirección del texto si no está incluida
        const addressFromText = extractAddress(content.description);
        const { data: report, error: reportErr } = await supabase
          .from("reports")
          .insert({
            user_id: userId,
            title: content.title,
            description: content.description,
            category: content.category,
            address: content.address || addressFromText || null,
            severity: content.severity,
            latitude: 0,
            longitude: 0,
          })
          .select("id, title, status")
          .single();
        if (reportErr) return JSON.stringify({ error: reportErr.message });

        await supabase
          .from("ai_content_drafts")
          .update({ is_accepted: true })
          .eq("id", toolInput.draft_id);

        return JSON.stringify({ report_id: report.id, title: report.title, status: report.status });
      }

      case "consultar_mis_reportes": {
        let query = supabase
          .from("reports")
          .select("id, title, status, category, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        if (toolInput.status) query = query.eq("status", toolInput.status);
        const { data, error } = await query;
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data || []);
      }

      case "consultar_mis_puntos": {
        const { data, error } = await supabase
          .from("profiles")
          .select("eco_points, level, streak_days, tasks_completed, reports_count")
          .eq("id", userId)
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data);
      }

      case "consultar_recompensas": {
        const { data, error } = await supabase
          .from("rewards")
          .select("id, title, description, type, points_cost, quantity_available, quantity_claimed")
          .eq("is_active", true)
          .order("points_cost", { ascending: true })
          .limit(10);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data || []);
      }

      case "consultar_mis_notificaciones": {
        const { data, error } = await supabase
          .from("notifications")
          .select("id, type, title, body, created_at")
          .eq("user_id", userId)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data || []);
      }

      case "crear_servicio_borrador": {
        const { data, error } = await supabase
          .from("ai_content_drafts")
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            draft_type: "feed_post",
            content: {
              title: toolInput.titulo,
              description: toolInput.descripcion,
              points_reward: toolInput.puntos_recompensa,
              max_volunteers: toolInput.max_voluntarios,
              address: toolInput.direccion,
              scheduled_at: toolInput.fecha_programada,
            },
            is_accepted: false,
          })
          .select("id")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ draft_id: data.id, message: "Borrador de servicio creado" });
      }

      case "confirmar_servicio": {
        const { data: draft, error: draftErr } = await supabase
          .from("ai_content_drafts")
          .select("*")
          .eq("id", toolInput.draft_id)
          .eq("user_id", userId)
          .single();
        if (draftErr || !draft) return JSON.stringify({ error: "Borrador no encontrado" });

        const c = draft.content as any;
        const { data: service, error: sErr } = await supabase
          .from("community_services")
          .insert({
            created_by: userId,
            title: c.title,
            description: c.description,
            points_reward: c.points_reward,
            max_volunteers: c.max_volunteers,
            address: c.address,
            scheduled_at: c.scheduled_at,
            status: "open",
          })
          .select("id, title, status")
          .single();
        if (sErr) return JSON.stringify({ error: sErr.message });

        await supabase.from("ai_content_drafts").update({ is_accepted: true }).eq("id", toolInput.draft_id);
        return JSON.stringify({ service_id: service.id, title: service.title, status: service.status });
      }

      case "ver_voluntarios_servicio": {
        const { data, error } = await supabase
          .from("service_volunteers")
          .select("id, status, applied_at, profiles(name)")
          .eq("service_id", toolInput.service_id);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data || []);
      }

      case "ver_reportes_verificados": {
        const { data, error } = await supabase
          .from("reports")
          .select("id, title, category, severity, address, created_at")
          .eq("status", "verified")
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data || []);
      }

      case "verificar_reporte": {
        const { data, error } = await supabase.rpc("verify_report", {
          p_report_id: toolInput.report_id,
          p_verifier_id: userId,
        });
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: "Reporte verificado" });
      }

      case "rechazar_reporte": {
        const { data, error } = await supabase.rpc("reject_report", {
          p_report_id: toolInput.report_id,
          p_verifier_id: userId,
          p_reason: toolInput.razon,
        });
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, message: "Reporte rechazado" });
      }

      case "ver_estadisticas": {
        const [reports, services, users] = await Promise.all([
          supabase.from("reports").select("status", { count: "exact" }),
          supabase.from("community_services").select("status", { count: "exact" }).eq("status", "open"),
          supabase.from("profiles").select("id", { count: "exact" }),
        ]);
        return JSON.stringify({
          total_reportes: reports.count || 0,
          servicios_activos: services.count || 0,
          usuarios_registrados: users.count || 0,
        });
      }

      case "ver_leaderboard": {
        const yearMonth = new Date().toISOString().slice(0, 7);
        const { data, error } = await supabase
          .from("leaderboard_monthly")
          .select("points, reports_count, tasks_completed, profiles(name)")
          .eq("year_month", yearMonth)
          .order("points", { ascending: false })
          .limit(10);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify(data || []);
      }

      default:
        return JSON.stringify({ error: `Tool desconocida: ${toolName}` });
    }
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
}

// ── Call Claude API ─────────────────────────────────────────────────
async function callClaude(
  system: string,
  messages: any[],
  tools: any[]
): Promise<any> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages,
      tools,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Main handler ────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { conversation_id, message, image_url, user_role, user_id } = await req.json();

    if (!message || !user_role || !user_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    let convId = conversation_id;

    // Crear conversación si es nueva
    if (!convId) {
      const { data: newConv, error } = await supabase
        .from("ai_conversations")
        .insert({ user_id, title: message.slice(0, 50) })
        .select("id")
        .single();
      if (error) throw error;
      convId = newConv.id;
    }

    // Guardar mensaje del usuario
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
      input_type: image_url ? "image" : "text",
      metadata: image_url ? { image_url } : undefined,
    });

    // Cargar historial (últimos 20)
    const { data: history } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true })
      .limit(20);

    const messages = (history || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const tools = getToolsForRole(user_role);
    const systemPrompt = SYSTEM_PROMPTS[user_role] || SYSTEM_PROMPTS.client;

    // Loop de tool_use hasta end_turn
    let currentMessages = [...messages];
    let response = await callClaude(systemPrompt, currentMessages, tools);
    let maxIterations = 5;

    while (response.stop_reason === "tool_use" && maxIterations > 0) {
      maxIterations--;

      // Agregar la respuesta del asistente al historial
      currentMessages.push({ role: "assistant", content: response.content });

      // Ejecutar cada tool_use
      const toolResults: any[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          const result = await executeTool(block.name, block.input, user_id, convId);

          // Guardar tool use en ai_messages como metadata
          await supabase.from("ai_messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: `[Tool: ${block.name}]`,
            metadata: { tool_name: block.name, tool_input: block.input, tool_result: result },
          });

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      currentMessages.push({ role: "user", content: toolResults });
      response = await callClaude(systemPrompt, currentMessages, tools);
    }

    // Extraer texto final
    const assistantText = response.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");

    // Guardar respuesta final
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: assistantText,
      input_type: "text",
    });

    return new Response(
      JSON.stringify({ conversation_id: convId, message: assistantText }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Chat agent error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});
