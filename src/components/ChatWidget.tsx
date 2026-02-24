"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

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

function MessageBubble({ message, index }: { message: ChatMessage; index: number }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className={`flex items-start gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : ""} min-w-0`}
    >
      {!isUser && <AIAvatar />}
      <div className={`min-w-0 max-w-[85%] sm:max-w-[80%] flex flex-col ${isUser ? "items-end" : ""}`}>
        <div
          className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-sm leading-relaxed break-words ${
            isUser
              ? "bg-accent text-dark rounded-tr-sm"
              : "bg-dark-card border border-dark-border text-slate-200 rounded-tl-sm"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <p className={`text-[10px] text-slate-600 mt-1 ${isUser ? "text-right" : ""}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </motion.div>
  );
}

interface ChatWidgetProps {
  className?: string;
  compact?: boolean;
}

export default function ChatWidget({ className = "", compact = false }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
              // skip
            }
          }
        }
      }

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
    <div className={`flex flex-col min-h-0 min-w-0 w-full ${compact ? "h-[400px] sm:h-[450px]" : "h-[calc(100vh-16rem)]"} ${className}`}>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-4 pr-2 -mr-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 && !streaming ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">Здесь можно поговорить</p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Напишите, что вас беспокоит, или выберите тему ниже
            </p>
          </div>
        ) : (
          messages.map((msg, i) => <MessageBubble key={msg.id} message={msg} index={i} />)
        )}

        {streaming && (
          <div className="flex items-start gap-2 sm:gap-3 min-w-0">
            <AIAvatar />
            <div className="min-w-0 max-w-[85%] sm:max-w-[80%]">
              <div className="bg-dark-card border border-dark-border rounded-2xl rounded-tl-sm px-3 py-2.5 sm:px-4 sm:py-3">
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

      {messages.length === 0 && !streaming && (
        <div className="flex flex-wrap gap-2 py-3 shrink-0">
          {QUICK_MESSAGES.map((msg) => (
            <button
              key={msg}
              onClick={() => sendMessage(msg)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-dark-card border border-dark-border rounded-lg text-xs sm:text-sm text-slate-400 hover:text-white hover:border-accent/30 transition-colors break-words max-w-full"
            >
              {msg}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="pt-3 border-t border-dark-border mt-3 shrink-0 min-w-0">
        <div className="flex gap-2 items-end min-w-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Напишите сообщение..."
            disabled={streaming}
            className="flex-1 min-w-0 px-3 py-2.5 sm:px-4 sm:py-3 bg-dark-lighter border border-dark-border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none transition-colors disabled:opacity-50 text-sm"
            style={{ maxHeight: 120 }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 120) + "px";
            }}
          />
          <Button type="submit" disabled={!input.trim() || streaming} className="shrink-0 !px-3 !py-2.5 sm:!px-4 sm:!py-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>

        {messages.length > 0 && !streaming && (
          <div className="flex flex-wrap gap-1.5 mt-2 min-w-0">
            {QUICK_MESSAGES.map((msg) => (
              <button
                key={msg}
                type="button"
                onClick={() => sendMessage(msg)}
                className="px-2 py-1 sm:px-2.5 bg-dark-lighter border border-dark-border rounded-md text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors break-words max-w-full"
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
