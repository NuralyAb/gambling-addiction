import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

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

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Не авторизован" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const openai = getOpenAI();
  if (!openai) {
    return new Response(
      JSON.stringify({ error: "Сервис AI временно недоступен. Проверьте настройки OPENAI_API_KEY." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Неверный формат запроса" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return new Response(JSON.stringify({ error: "Пустое сообщение" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = (session.user as { id: string }).id;

  // Сохраняем сообщение пользователя в БД (не блокируем чат при ошибке)
  try {
    await supabase.from("chat_messages").insert({
      user_id: userId,
      role: "user",
      content: message,
    });
  } catch (e) {
    console.warn("Chat: failed to save user message", e);
  }

  // Загружаем историю (последние 20 сообщений). При ошибке — работаем без истории.
  let chatHistory: { role: "user" | "assistant"; content: string }[] = [];
  try {
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    chatHistory = (history || [])
      .reverse()
      .map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  } catch (e) {
    console.warn("Chat: failed to load history", e);
  }

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";

  let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  try {
    stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatHistory,
      ],
      stream: true,
      max_tokens: 500,
      temperature: 0.7,
    });
  } catch (err) {
    console.error("OpenAI chat error:", err);
    return new Response(
      JSON.stringify({
        error: "Не удалось получить ответ от AI. Проверьте OPENAI_API_KEY и модель.",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

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

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();

        if (fullResponse.trim()) {
          try {
            await supabase.from("chat_messages").insert({
              user_id: userId,
              role: "assistant",
              content: fullResponse.trim(),
            });
          } catch (e) {
            console.warn("Chat: failed to save assistant message", e);
          }
        }
      } catch (error) {
        console.error("Chat stream error:", error);
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

  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.warn("Chat GET history error:", error);
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data || []), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.warn("Chat GET error:", e);
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
