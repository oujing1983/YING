/**
 * Multi-provider AI client supporting OpenAI-compatible APIs.
 * Configure via settings or environment variables.
 */

import { getDb } from '@/lib/db';

interface LLMConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
}

function getConfig(): LLMConfig {
  // Try settings table first
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'llm_config'").get() as any;
    if (row) {
      const config = JSON.parse(row.value);
      return {
        apiUrl: config.apiUrl || process.env.LLM_API_URL || 'https://api.deepseek.com/v1',
        apiKey: config.apiKey || process.env.LLM_API_KEY || '',
        model: config.model || process.env.LLM_MODEL || 'deepseek-chat',
        temperature: config.temperature ?? 0.3,
      };
    }
  } catch {/* settings table might not exist yet */}

  return {
    apiUrl: process.env.LLM_API_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'deepseek-chat',
    temperature: 0.3,
  };
}

export async function llmChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const config = getConfig();

  if (!config.apiKey) {
    throw new Error('AI API Key 未配置，请在设置页面配置');
  }

  const body: Record<string, any> = {
    model: config.model,
    messages,
    temperature: options?.temperature ?? config.temperature,
    max_tokens: options?.maxTokens ?? 2000,
  };

  if (options?.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${config.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API 错误 (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function llmChatJson<T>(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const text = await llmChat(messages, { ...options, jsonMode: true });
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr) as T;
}
