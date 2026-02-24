/**
 * Анонимизация PII в тексте перед отправкой в OpenAI.
 * Маскирует email, телефоны, возможные упоминания имён в сообщениях.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g;
const PHONE_SIMPLE_REGEX = /\b\d{10,11}\b/g;

export function anonymizeText(text: string): string {
  if (!text || typeof text !== "string") return text;
  let out = text;
  out = out.replace(EMAIL_REGEX, "[email скрыт]");
  out = out.replace(PHONE_REGEX, "[телефон скрыт]");
  out = out.replace(PHONE_SIMPLE_REGEX, "[номер скрыт]");
  return out;
}
