import "server-only";

type OpenAIResponse = { output_text?: string };
type ChatCompletionResponse = { choices?: Array<{ message?: { content?: string } }> };

export async function generateJson<T>(instructions: string, input: string): Promise<T> {
  const provider = process.env.AI_PROVIDER ?? "openai";
  const isTokenFaucet = provider === "tokenfaucet";
  const apiKey = isTokenFaucet ? process.env.TOKENFAUCET_API_KEY : process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error(isTokenFaucet ? "TOKENFAUCET_API_KEY is not configured." : "OPENAI_API_KEY is not configured.");

  const baseUrl = isTokenFaucet ? (process.env.TOKENFAUCET_BASE_URL ?? "https://freetokenfaucet.com/v1") : "https://api.openai.com/v1";
  const model = isTokenFaucet ? (process.env.TOKENFAUCET_MODEL ?? "deepseek-v4-flash") : (process.env.OPENAI_MODEL ?? "gpt-4.1-mini");

  const request = isTokenFaucet
    ? {
        url: `${baseUrl}/chat/completions`,
        body: { model, messages: [{ role: "system", content: `${instructions} Return valid JSON only.` }, { role: "user", content: `Return a JSON object only. ${input}` }], response_format: { type: "json_object" }, temperature: 0.3 }
      }
    : {
        url: `${baseUrl}/responses`,
        body: { model, instructions, input: `Return a JSON object only. ${input}`, text: { format: { type: "json_object" } }, max_output_tokens: 2200 }
      };

  const response = await fetch(request.url, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(request.body) });
  if (!response.ok) { const detail = await response.text(); throw new Error(`${provider} request failed: ${response.status} ${detail}`); }
  const data = await response.json() as OpenAIResponse & ChatCompletionResponse;
  const output = isTokenFaucet ? data.choices?.[0]?.message?.content : data.output_text;
  if (!output) throw new Error(`${provider} returned no text.`);
  return JSON.parse(output) as T;
}
