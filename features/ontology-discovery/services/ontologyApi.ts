import type { ConfirmationItem } from "../models/confirmation";
import type { Attribute, Entity, OntologyDiscoveryResult, Relation, SchemaSnapshot } from "../models/ontology";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ApiEntity = Entity & { technicalName?: string };
type ApiDocument = {
  id: string;
  businessId?: string;
  entities: ApiEntity[];
  relations: Relation[];
  metadata: OntologyDiscoveryResult["metadata"];
  source?: OntologyDiscoveryResult["source"];
};

async function readError(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : ""))
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  return "No pudimos completar la operación. Revisa el schema e inténtalo otra vez.";
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new Error("No pudimos hablar con el API. Confirma que el backend esté en el puerto 8000.");
  }
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<T>;
}

function mapDocument(document: ApiDocument): OntologyDiscoveryResult {
  const relations: Relation[] = (document.relations ?? []).map((relation) => ({
    id: relation.id,
    from: relation.from,
    to: relation.to,
    cardinality: relation.cardinality,
    foreignKey: relation.foreignKey,
    description: relation.description,
    confidence: relation.confidence,
  }));
  const entities: Entity[] = (document.entities ?? []).map((entity) => ({
    id: entity.id,
    name: entity.name,
    technicalName: entity.technicalName,
    schema: entity.schema,
    type: entity.type,
    description: entity.description,
    confidence: entity.confidence,
    attributes: (entity.attributes ?? []).map((attribute: Attribute) => ({
      id: attribute.id,
      name: attribute.name,
      technicalName: attribute.technicalName,
      dataType: attribute.dataType,
      semanticType: attribute.semanticType,
      description: attribute.description,
      confidence: attribute.confidence,
      nullable: attribute.nullable,
    })),
    relations: [],
  }));
  return {
    id: document.id,
    businessId: document.businessId,
    entities,
    relations,
    metadata: {
      analyzedAt: document.metadata.analyzedAt,
      totalConfidence: document.metadata.totalConfidence,
      pendingConfirmations: document.metadata.pendingConfirmations,
      confidenceThreshold: document.metadata.confidenceThreshold,
    },
    source: document.source,
  };
}

export const ontologyApi = {
  getCurrent: async (businessId?: string) => {
    const query = businessId ? `?businessId=${encodeURIComponent(businessId)}` : "";
    try {
      const document = await request<ApiDocument>(`${API_URL}/api/ontology/current${query}`);
      return mapDocument(document);
    } catch (error) {
      if (error instanceof Error && /no (hay|existe)|todavia/i.test(error.message)) return null;
      if (error instanceof Error && error.message.includes("404")) return null;
      return null;
    }
  },
  discoverFromSchema: async (snapshot: SchemaSnapshot) => {
    const document = await request<ApiDocument>(`${API_URL}/api/ontology/discover`, {
      method: "POST",
      body: JSON.stringify(snapshot),
    });
    return mapDocument(document);
  },
  confirmOntology: (ontologyId: string, confirmations: ConfirmationItem[]) =>
    request<{ saved: boolean }>(`${API_URL}/api/ontology/confirm`, {
      method: "POST",
      body: JSON.stringify({ ontologyId, confirmations }),
    }),
  listVersions: async (businessId: string) => {
    try {
      return await request<Array<{
        version: number;
        ontologyId: string;
        status: string;
        isCurrent: boolean;
        changeNote: string | null;
        createdAt: string;
      }>>(`${API_URL}/api/ontology/versions?businessId=${encodeURIComponent(businessId)}`);
    } catch {
      return [];
    }
  },
  rollback: async (businessId: string, version: number) => {
    const document = await request<ApiDocument>(`${API_URL}/api/ontology/rollback`, {
      method: "POST",
      body: JSON.stringify({ businessId, version }),
    });
    return mapDocument(document);
  },
};
