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

export type Attribute = {
  id: string;
  name: string;
  technicalName?: string;
  dataType: string;
  semanticType?: string;
  description?: string;
  confidence: number;
  nullable: boolean;
};

export type Relation = {
  id: string;
  from: string;
  to: string;
  cardinality: "1-1" | "1-N" | "N-N";
  foreignKey?: string;
  description?: string;
  confidence: number;
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
};

export type OntologyDiscoveryResult = {
  id: string;
  businessId?: string;
  entities: Entity[];
  relations: Relation[];
  metadata: {
    analyzedAt: string;
    totalConfidence: number;
    pendingConfirmations: number;
    confidenceThreshold?: number;
  };
  source?: {
    id: string;
    name: string;
    engine: string;
  };
};
