/**
 * Ollama API Client for NotebookLM-style chat
 * Provides local LLM inference via Ollama
 */

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_ctx?: number;
    num_predict?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_ctx?: number;
    num_predict?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaListResponse {
  models: OllamaModelInfo[];
}

export class OllamaClient {
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor(options?: { host?: string; model?: string; timeout?: number }) {
    this.baseUrl = options?.host || process.env.OLLAMA_HOST || "http://localhost:11434";
    this.model = options?.model || process.env.OLLAMA_MODEL || "llama3.2:latest";
    this.timeout = options?.timeout || parseInt(process.env.OLLAMA_TIMEOUT || "60000");
  }

  /**
   * Check if Ollama is available and responding
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }

      const data: OllamaListResponse = await response.json();
      return data.models || [];
    } catch (error) {
      console.error("Error listing Ollama models:", error);
      return [];
    }
  }

  /**
   * Check if specific model is available
   */
  async hasModel(modelName?: string): Promise<boolean> {
    const models = await this.listModels();
    const targetModel = modelName || this.model;
    return models.some((m) => m.name === targetModel || m.name.startsWith(targetModel.split(":")[0]));
  }

  /**
   * Generate a response using the /api/generate endpoint
   */
  async generate(
    prompt: string,
    options?: {
      system?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt,
          system: options?.system,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2048,
            num_ctx: 8192, // Context window
          },
        } satisfies OllamaGenerateRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama generate failed: ${response.status} - ${errorText}`);
      }

      const data: OllamaGenerateResponse = await response.json();
      return data.response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Ollama request timed out after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Chat with conversation history using /api/chat endpoint
   */
  async chat(
    messages: OllamaMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<OllamaMessage> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2048,
            num_ctx: 8192,
          },
        } satisfies OllamaChatRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama chat failed: ${response.status} - ${errorText}`);
      }

      const data: OllamaChatResponse = await response.json();
      return data.message;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Ollama chat timed out after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Get model info
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Singleton instance for easy import
let ollamaClient: OllamaClient | null = null;

export function getOllamaClient(): OllamaClient {
  if (!ollamaClient) {
    ollamaClient = new OllamaClient();
  }
  return ollamaClient;
}

export default OllamaClient;
