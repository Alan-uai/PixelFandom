import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_MODEL = "gemini-embedding-2-preview";
const DIMENSIONS = 1536;

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(
    `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: text.slice(0, 8000) }] },
        outputDimensionality: DIMENSIONS,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || `Gemini error (${res.status})`);
  }

  const data = await res.json();
  return data.embedding.values;
}

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req, ctx) => {
    try {
      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiKey) {
        return new Response("GEMINI_API_KEY not set", { status: 500 });
      }

      const { table, record } = await req.json();
      if (!table || !record?.id) {
        return new Response("Missing table or record.id", { status: 400 });
      }

      let text = "";

      if (table === "wiki_articles") {
        text = [
          record.title || "",
          record.summary || "",
          record.content || "",
        ].filter(Boolean).join(" ").slice(0, 8000);
      } else if (table === "collection_items") {
        const data =
          typeof record.data === "string"
            ? JSON.parse(record.data)
            : record.data || {};
        text = [data.name || "", data.description || ""]
          .filter(Boolean)
          .join(" ")
          .slice(0, 8000);
      } else {
        return new Response(`Unknown table: ${table}`, { status: 400 });
      }

      if (!text) {
        return new Response("No text to embed", { status: 200 });
      }

      const embedding = await generateEmbedding(text, geminiKey);

      const { error } = await ctx.supabaseAdmin
        .from(table)
        .update({ embedding: `[${embedding.join(",")}]` })
        .eq("id", record.id);

      if (error) {
        console.error(`Failed to update ${table} ${record.id}:`, error);
        return new Response(error.message, { status: 500 });
      }

      return new Response("ok", { status: 200 });
    } catch (err) {
      console.error("generate-embedding error:", err);
      return new Response(err instanceof Error ? err.message : "Unknown error", {
        status: 500,
      });
    }
  }),
};
