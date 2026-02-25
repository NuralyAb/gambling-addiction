"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

// ── Types ──

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ── Constants ──

const QUICK_MESSAGES = [
  "Мне плохо и хочется играть",
  "Я только что проиграл",
  "Хочу поговорить о своих триггерах",
  "Как справиться с желанием прямо сейчас",
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Page ──

export default function SupportPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = typeof errBody?.error === "string" ? errBody.error : "Ошибка сервера";
        throw new Error(msg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
                setStreamingText(fullText);
              }
              if (parsed.error) {
                fullText += `\n\n_${parsed.error}_`;
                setStreamingText(fullText);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }

      // Add assistant message to state
      if (fullText.trim()) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: fullText.trim(),
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: error instanceof Error ? error.message : "Извините, произошла ошибка. Попробуйте ещё раз.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setStreaming(false);
      setStreamingText("");
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-4 border-b border-dark-border mb-4">
        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Помощник</h1>
          <p className="text-xs text-slate-500">
            Безопасное пространство для разговора
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <a href="tel:88002000122" className="px-2 py-1.5 sm:py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors whitespace-nowrap">
            SOS: 8-800-2000-122
          </a>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 && !streaming ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">Здесь можно поговорить</p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Я здесь, чтобы выслушать и помочь. Вы можете рассказать о том, что вас беспокоит, или выбрать одну из тем ниже.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} index={i} />
          ))
        )}

        {/* Streaming indicator */}
        {streaming && (
          <div className="flex items-start gap-3">
            <AIAvatar />
            <div className="max-w-[85%] sm:max-w-[80%]">
              <div className="bg-dark-card border border-dark-border rounded-2xl rounded-tl-sm px-4 py-3">
                {streamingText ? (
                  <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {streamingText}
                    <span className="inline-block w-1.5 h-4 bg-accent ml-0.5 animate-pulse" />
                  </p>
                ) : (
                  <TypingIndicator />
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick buttons */}
      {messages.length === 0 && !streaming && (
        <div className="flex flex-wrap gap-2 py-3">
          {QUICK_MESSAGES.map((msg) => (
            <button
              key={msg}
              onClick={() => sendMessage(msg)}
              className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-slate-400 hover:text-white hover:border-accent/30 transition-colors"
            >
              {msg}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-dark-border mt-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Напишите сообщение..."
            disabled={streaming}
            className="flex-1 px-4 py-3 bg-dark-lighter border border-dark-border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none transition-colors disabled:opacity-50 text-sm"
            style={{ maxHeight: 120 }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 120) + "px";
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || streaming}
            className="shrink-0 !px-4 !py-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>

        {messages.length > 0 && !streaming && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_MESSAGES.map((msg) => (
              <button
                key={msg}
                type="button"
                onClick={() => sendMessage(msg)}
                className="px-2.5 py-1 bg-dark-lighter border border-dark-border rounded-md text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

// ── Components ──

function AIAvatar() {
  return (
    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center shrink-0 mt-1">
      <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-slate-500 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

function MessageBubble({
  message,
  index,
}: {
  message: ChatMessage;
  index: number;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {!isUser && <AIAvatar />}

      <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? "items-end" : ""}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-accent text-dark rounded-tr-sm"
              : "bg-dark-card border border-dark-border text-slate-200 rounded-tl-sm"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p
          className={`text-[10px] text-slate-600 mt-1 ${
            isUser ? "text-right" : ""
          }`}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </motion.div>
  );
}
