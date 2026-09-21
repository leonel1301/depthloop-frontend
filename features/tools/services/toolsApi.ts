import { readSession } from "@/features/auth/services/sessionStore";
import { isToolId, type ToolId, type ToolRecommendation, type ToolSelection } from "../models";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): HeadersInit {
  const token = readSession()?.token;
  if (!token) throw new Error("Inicia sesión para configurar herramientas.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  if (typeof payload?.detail === "string" && payload.detail.trim()) return payload.detail;
  return "No pudimos guardar las herramientas.";
}

function normalize(payload: Partial<ToolSelection>): ToolSelection {
  return {
    selectedTools: (payload.selectedTools ?? []).filter(isToolId),
    updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : null,
  };
}

async function request(init?: RequestInit): Promise<ToolSelection> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/tools/selection`, {
      ...init,
      headers: { ...authHeaders(), ...init?.headers },
    });
  } catch {
    throw new Error("No pudimos hablar con el API. Confirma que el backend esté en el puerto 8000.");
  }
  if (!response.ok) throw new Error(await readError(response));
  return normalize(await response.json() as ToolSelection);
}

export const toolsApi = {
  load: () => request(),
  save: (selectedTools: ToolId[]) => request({
    method: "PUT",
    body: JSON.stringify({ selectedTools }),
  }),
  recommend: async (question: string, availableTools: ToolId[], signal?: AbortSignal): Promise<ToolRecommendation[]> => {
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/tools/recommend`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ question, availableTools }),
        signal,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
      throw new Error("No pudimos preparar las recomendaciones.");
    }
    if (!response.ok) throw new Error(await readError(response));
    const payload = await response.json() as { recommendations?: unknown };
    if (!Array.isArray(payload.recommendations)) return [];
    return payload.recommendations.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Partial<ToolRecommendation>;
      if (!isToolId(candidate.id) || typeof candidate.reason !== "string" || typeof candidate.confidence !== "number") return [];
      return [{ id: candidate.id, reason: candidate.reason, confidence: candidate.confidence }];
    });
  },
};
