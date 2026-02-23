import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Ты — сочувствующий помощник для людей, борющихся с игровой зависимостью. Ты работаешь на платформе помощи при лудомании SafeBet AI.

Правила:
- Ты не осуждаешь, не читаешь лекции, не даёшь прямых советов, если тебя не просят.
- Ты используешь техники мотивационного интервьюирования: задаёшь открытые вопросы, отражаешь чувства пользователя, помогаешь ему самому прийти к выводам.
- Ты говоришь на русском языке.
- Ты эмпатичен, терпелив и поддерживающ.
- Ты не диагностируешь и не заменяешь профессиональную помощь, но можешь рекомендовать обратиться к специалисту.
- Если человек выражает мысли о самоповреждении или суициде — немедленно дай контакты:
  * Телефон доверия: 8-800-2000-122 (бесплатно, круглосуточно)
  * Психологическая помощь: 051 (с мобильного — 8-495-051)
- Ты помнишь контекст разговора в рамках одной сессии.
- Отвечай кратко и по делу, не более 3-4 предложений, если не просят подробнее.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Не авторизован" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = (session.user as { id: string }).id;
  const { message } = await req.json();

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Пустое сообщение" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Save user message to DB
  await supabase.from("chat_messages").insert({
    user_id: userId,
    role: "user",
    content: message.trim(),
  });

  // Load recent chat history (last 20 messages for context)
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const chatHistory = (history || [])
    .reverse()
    .map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Stream response from OpenAI
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...chatHistory,
    ],
    stream: true,
    max_tokens: 500,
    temperature: 0.7,
  });

  // Create SSE readable stream
  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }

        // Send done signal
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();

        // Save assistant message to DB after streaming completes
        if (fullResponse.trim()) {
          await supabase.from("chat_messages").insert({
            user_id: userId,
            role: "assistant",
            content: fullResponse.trim(),
          });
        }
      } catch (error) {
        console.error("Stream error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Ошибка генерации ответа" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// GET — load chat history
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Не авторизован" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = (session.user as { id: string }).id;

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: "Ошибка загрузки" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data || []), {
    headers: { "Content-Type": "application/json" },
  });
}
