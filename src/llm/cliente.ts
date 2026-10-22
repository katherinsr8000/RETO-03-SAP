
import "dotenv/config";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export const clienteOpenAI = apiKey
  ? new OpenAI({ apiKey })
  : null;

export const modeloOpenAI =
  process.env.OPENAI_MODEL || "gpt-4.1-mini";

export function verificarConfiguracionIA(): boolean {
  return clienteOpenAI !== null;
}
