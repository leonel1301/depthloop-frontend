export type SourceKind = "database" | "service" | "schema";

export type DbConnectionConfig = {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  kind?: SourceKind;
  serviceUrl?: string;
  apiKey?: string;
  ssl?: boolean;
};

export type SchemaSnapshot = {
  source: {
    id?: string;
    name: string;
    engine: string;
    businessId?: string;
  };
  schemas: Array<{
    name: string;
    tables: Array<{
      name: string;
      type?: "table" | "view";
      comment?: string | null;
      columns: Array<{
        name: string;
        dataType: string;
        nullable: boolean;
        primaryKey?: boolean;
        unique?: boolean;
        comment?: string | null;
      }>;
      foreignKeys?: Array<{
        name?: string | null;
        columns: string[];
        referencedSchema?: string | null;
        referencedTable: string;
        referencedColumns: string[];
      }>;
      indexes?: Array<{
        name: string;
        columns: string[];
        unique?: boolean;
      }>;
    }>;
  }>;
};

export type ConnectedSource = {
  id: string;
  kind: SourceKind;
  label: string;
  engine?: string;
  config?: DbConnectionConfig;
};

export type ReviewState = {
  status: "suggested" | "confirmed" | "rejected";
  reviewedAt?: string | null;
};

export type OntologySource = {
  id: string;
  name: string;
  engine: string;
};

export type CanonicalAttributeBinding = {
  id: string;
  sourceId: string;
  entityId: string;
  attributeId: string;
  schema: string;
  table: string;
  column: string;
  dataType: string;
  confidence: number;
  review: ReviewState;
};

export type CanonicalField = {
  id: string;
  name: string;
  description: string;
  semanticType: string;
  aliases: string[];
  bindings: CanonicalAttributeBinding[];
};

export type CanonicalConcept = {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  bindings: Array<{
    id: string;
    sourceId: string;
    entityId: string;
    schema: string;
    table: string;
    engine: string;
    confidence: number;
    review: ReviewState;
  }>;
  fields: CanonicalField[];
};

export type DriftChange = {
  id: string;
  kind: "entity" | "attribute" | "relation";
  operation: "added" | "removed" | "changed";
  path: string;
  label: string;
  breaking: boolean;
  impact: "low" | "medium" | "high";
  affectedConceptIds: string[];
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

export type DriftReport = {
  sourceId: string;
  baselineOntologyId?: string | null;
  previousFingerprint?: string | null;
  currentFingerprint: string;
  detectedAt: string;
  detected: boolean;
  impact: "none" | "low" | "medium" | "high";
  summary: { added: number; removed: number; changed: number; breaking: number };
  affectedConceptIds: string[];
  changes: DriftChange[];
};

export type Attribute = {
  id: string;
  name: string;
  technicalName?: string;
  dataType: string;
  semanticType?: string;
  description?: string;
  confidence: number;
  nullable: boolean;
  review?: ReviewState;
};

export type Relation = {
  id: string;
  from: string;
  to: string;
  cardinality: "1-1" | "1-N" | "N-N";
  foreignKey?: string;
  description?: string;
  confidence: number;
  review?: ReviewState;
};

export type Entity = {
  id: string;
  name: string;
  technicalName?: string;
  schema?: string;
  type: "table" | "view";
  description?: string;
  confidence: number;
  attributes: Attribute[];
  relations: Relation[];
  sources: OntologySource[];
  canonicalConcepts: CanonicalConcept[];
  drift?: DriftReport | null;
  review?: ReviewState;
};

export type OntologyDiscoveryResult = {
  id: string;
  businessId?: string;
  status: "draft" | "reviewed" | "published";
  entities: Entity[];
  relations: Relation[];
  metadata: {
    analyzedAt: string;
    totalConfidence: number;
    pendingConfirmations: number;
    confidenceThreshold?: number;
  };
  source?: OntologySource;
};
