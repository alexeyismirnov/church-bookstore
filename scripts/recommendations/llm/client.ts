/**
 * LLM Client — OpenAI-compatible API client with retry, timeout, and concurrency control.
 *
 * Sprint 4: Uses Node.js built-in fetch (no external dependencies).
 */

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  concurrency: number;
  timeout: number; // ms
}

const DEFAULT_CONFIG: Omit<LLMConfig, 'apiKey'> = {
  baseUrl: 'https://nano-gpt.com/api/v1',
  model: 'gemini-3.1-flash-lite',
  concurrency: 5,
  timeout: 30_000,
};

const DEFAULT_API_KEY = '';

/**
 * Load LLM configuration from environment variables with sensible defaults.
 */
export function loadLLMConfigFromEnv(): LLMConfig {
  return {
    apiKey: process.env.RECOMMENDATIONS_LLM_API_KEY ?? DEFAULT_API_KEY,
    baseUrl:
      process.env.RECOMMENDATIONS_LLM_BASE_URL ?? DEFAULT_CONFIG.baseUrl,
    model: process.env.RECOMMENDATIONS_LLM_MODEL ?? DEFAULT_CONFIG.model,
    concurrency: parseInt(
      process.env.RECOMMENDATIONS_LLM_CONCURRENCY ?? String(DEFAULT_CONFIG.concurrency),
      10
    ),
    timeout: DEFAULT_CONFIG.timeout,
  };
}

/**
 * Call an OpenAI-compatible chat completions endpoint.
 *
 * Includes retry logic (3 attempts with exponential backoff) and request timeout.
 */
export async function callLLM(
  config: LLMConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const url = `${config.baseUrl}/chat/completions`;
  const body = JSON.stringify({
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  };

  const maxRetries = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown error');
        throw new Error(
          `LLM API returned ${response.status} ${response.statusText}: ${errorText}`
        );
      }

      const json = (await response.json()) as {
        choices: { message: { content: string } }[];
      };

      if (!json.choices?.[0]?.message?.content) {
        throw new Error('LLM API returned empty or malformed response');
      }

      return json.choices[0].message.content;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error(
          `LLM request timed out after ${config.timeout}ms (attempt ${attempt}/${maxRetries})`
        );
      } else {
        lastError =
          err instanceof Error
            ? new Error(
                `${err.message} (attempt ${attempt}/${maxRetries})`
              )
            : new Error(`Unknown error (attempt ${attempt}/${maxRetries})`);
      }

      // Exponential backoff: 1s, 2s, 4s — but don't sleep after the last attempt
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(
    `LLM call failed after ${maxRetries} attempts: ${lastError?.message ?? 'unknown error'}`
  );
}

/**
 * Process an array of items with a maximum concurrency limit.
 *
 * @param items - Items to process
 * @param fn - Async function to apply to each item
 * @param concurrency - Maximum number of parallel operations
 */
export async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number
): Promise<void> {
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index++;
      await fn(items[currentIndex]);
    }
  }

  const workers: Promise<void>[] = [];
  const workerCount = Math.min(concurrency, items.length);

  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
}
