"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ConfirmationItem } from "../models/confirmation";
import type { ConnectedSource, DbConnectionConfig, OntologyDiscoveryResult, SchemaSnapshot } from "../models/ontology";
import type { IntakeMode, ConnectionIntent } from "../components/DbConnector";
import { ontologyApi } from "../services/ontologyApi";
import { queryApi } from "../services/queryApi";
import { reviewsApi } from "../services/reviewsApi";
import { deleteRemoteSource, listRemoteSources, upsertRemoteSource } from "../services/sourcesApi";
import {
  connectionForQuery,
  createBusinessId,
  readWorkspace,
  type QuerySource,
  writeSecret,
  writeWorkspace,
  readSecrets,
  clearSecret,
} from "../services/workspaceStore";

type SourceDialog = "add" | "manage" | "reconnect" | null;

function toQuerySource(config: DbConnectionConfig, engine?: string): QuerySource {
  const id = `db-${config.host}-${config.database}-${config.user}`.toLowerCase();
  const label = `Base ${config.database}`;
  return {
    id,
    kind: config.kind || "database",
    label,
    engine,
    config: {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      kind: config.kind,
      serviceUrl: config.serviceUrl,
      ssl: config.ssl ?? true,
    },
  };
}

function useOntologyWorkspace() {
  const [businessId, setBusinessId] = useState("");
  const [sources, setSources] = useState<ConnectedSource[]>([]);
  const [querySources, setQuerySources] = useState<QuerySource[]>([]);
  const [ontology, setOntology] = useState<OntologyDiscoveryResult | null>(null);
  const [publishedOntology, setPublishedOntology] = useState<OntologyDiscoveryResult | null>(null);
  const [confirmations, setConfirmations] = useState<ConfirmationItem[]>([]);
  const [activeSourceId, setActiveSourceId] = useState("");
  const [sourceDialog, setSourceDialog] = useState<SourceDialog>(null);
  const [reconnectSource, setReconnectSource] = useState<QuerySource | null>(null);
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("database");
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const local = readWorkspace();
    const boot = async () => {
      try {
        let next = local.businessId || createBusinessId();
        let nextOntology = local.ontology;
        let nextPublishedOntology = local.publishedOntology;
        let nextSources = local.sources;
        let nextQuery = local.querySources;
        const remoteSources = await listRemoteSources();
        if (remoteSources.length) {
          const localById = new Map(nextQuery.map((source) => [source.id, source]));
          nextQuery = remoteSources.map((source) => localById.get(source.id) ?? source);
        }
        let nextConfirmations = local.confirmations;
        const [remoteOntology, remotePublishedOntology] = await Promise.all([
          ontologyApi.getCurrent(next),
          ontologyApi.getPublished(next),
        ]);
        nextPublishedOntology = remotePublishedOntology;
        if (remoteOntology && (!remoteOntology.businessId || remoteOntology.businessId === next)) {
          nextOntology = remoteOntology;
          next = remoteOntology.businessId || next;
        } else if (nextOntology?.businessId && nextOntology.businessId !== next) {
          nextOntology = null;
          nextPublishedOntology = null;
          nextSources = [];
          nextQuery = [];
          nextConfirmations = [];
        } else if (nextOntology && !nextOntology.businessId) {
          nextOntology = { ...nextOntology, businessId: next };
        }
        if (nextOntology) {
          try {
            const remoteReviews = await reviewsApi.list(nextOntology.id);
            if (remoteReviews.updatedAt != null) {
              nextConfirmations = remoteReviews.items;
            } else if (nextConfirmations.length) {
              await reviewsApi.save(nextOntology.id, nextConfirmations);
            }
          } catch {
            // La copia local cubre el arranque si la API no responde.
          }
        }
        const nextActive = nextQuery.some((source) => source.id === local.activeSourceId)
          ? local.activeSourceId || nextQuery[0]?.id || ""
          : nextQuery[0]?.id || nextSources[0]?.id || "";
        setBusinessId(next);
        setOntology(nextOntology);
        setPublishedOntology(nextPublishedOntology);
        setSources(nextSources);
        setQuerySources(nextQuery);
        setConfirmations(nextConfirmations);
        setActiveSourceId(nextActive);
        writeWorkspace({
          businessId: next,
          ontology: nextOntology,
          publishedOntology: nextPublishedOntology,
          sources: nextSources,
          querySources: nextQuery,
          confirmations: nextConfirmations,
          activeSourceId: nextActive,
        });
      } finally {
        setReady(true);
      }
    };
    void boot();
  }, []);

  useEffect(() => {
    if (!ready || !businessId) return;
    writeWorkspace({ businessId, ontology, publishedOntology, sources, querySources, confirmations, activeSourceId });
  }, [ready, businessId, ontology, publishedOntology, sources, querySources, confirmations, activeSourceId]);

  useEffect(() => {
    if (!ready || !ontology?.id) return;
    const timer = window.setTimeout(() => {
      void reviewsApi.save(ontology.id, confirmations).catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [ready, ontology?.id, confirmations]);

  const openSourceDialog = useCallback((mode: Exclude<SourceDialog, null>, intake: IntakeMode = "database", source?: QuerySource) => {
    setError(null);
    const kind = source?.kind;
    setIntakeMode(kind === "service" || kind === "schema" ? kind : intake);
    setReconnectSource(mode === "reconnect" ? source ?? null : null);
    setSourceDialog(mode);
  }, []);

  const closeSourceDialog = useCallback(() => {
    setSourceDialog(null);
    setReconnectSource(null);
    setError(null);
  }, []);

  const discoverFromSchema = async (snapshot: SchemaSnapshot) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ontologyApi.discoverFromSchema({
        ...snapshot,
        source: { ...snapshot.source, businessId },
      });
      const stamped = { ...result, businessId: result.businessId || businessId };
      if (stamped.businessId && stamped.businessId !== businessId) setBusinessId(stamped.businessId);
      const next: ConnectedSource = {
        id: stamped.source?.id || snapshot.source.id || `src-${snapshot.source.name}`,
        kind: "schema",
        label: stamped.source?.name || snapshot.source.name,
        engine: stamped.source?.engine || snapshot.source.engine,
      };
      setOntology(stamped);
      setConfirmations([]);
      setSources((current) => {
        const exists = current.some((source) => source.label === next.label);
        return exists ? current.map((source) => (source.label === next.label ? next : source)) : [...current, next];
      });
      setActiveSourceId(next.id);
      void upsertRemoteSource({
        id: next.id,
        kind: "schema",
        label: next.label,
        engine: next.engine,
        config: { kind: "schema", host: "", port: 0, user: "", database: snapshot.source.name },
      });
      return next.label;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const discoverFromConnection = async (config: DbConnectionConfig, engine?: string, intent: ConnectionIntent = "discover") => {
    setIsLoading(true);
    setError(null);
    try {
      if (config.kind === "service") {
        throw new Error("El conector de API aún no ejecuta consultas. Usa una base PostgreSQL para Inferir.");
      }
      const querySource = toQuerySource(config, engine);
      await upsertRemoteSource(querySource);
      await queryApi.run(config, "select current_database() as database, current_user as db_user", querySource.id, businessId);
      writeSecret(querySource.id, { password: config.password, apiKey: config.apiKey });
      setQuerySources((current) => {
        const exists = current.some((source) => source.id === querySource.id);
        return exists ? current.map((source) => (source.id === querySource.id ? querySource : source)) : [...current, querySource];
      });
      const next: ConnectedSource = {
        id: querySource.id,
        kind: "database",
        label: querySource.label,
        engine,
        config: querySource.config,
      };
      setSources((current) => {
        const exists = current.some((source) => source.id === next.id);
        return exists ? current.map((source) => (source.id === next.id ? next : source)) : [...current, next];
      });
      setActiveSourceId(querySource.id);
      if (intent === "connect") return querySource.label;
      const snapshot = await queryApi.introspect(config, querySource.id, businessId);
      const result = await ontologyApi.discoverFromSchema({
        ...snapshot,
        source: { ...snapshot.source, businessId },
      });
      const stamped = { ...result, businessId: result.businessId || businessId };
      if (stamped.businessId && stamped.businessId !== businessId) setBusinessId(stamped.businessId);
      setOntology(stamped);
      setConfirmations([]);
      return querySource.label;
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos conectar la fuente.";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeSource = (sourceId: string) => {
    clearSecret(sourceId);
    setQuerySources((current) => current.filter((source) => source.id !== sourceId));
    setSources((current) => current.filter((source) => source.id !== sourceId));
    setActiveSourceId((current) => (current === sourceId ? "" : current));
    void deleteRemoteSource(sourceId);
  };

  const activeSource = querySources.find((source) => source.id === activeSourceId)
    ?? sources.find((source) => source.id === activeSourceId)
    ?? querySources[0]
    ?? sources[0]
    ?? null;

  return {
    businessId,
    ready,
    discoverFromSchema,
    discoverFromConnection,
    removeSource,
    ontology,
    publishedOntology,
    isLoading,
    error,
    sources,
    querySources,
    confirmations,
    setConfirmations,
    setOntology,
    setPublishedOntology,
    connectionForQuery,
    hasSession: (sourceId: string) => Boolean(readSecrets()[sourceId]?.password),
    activeSourceId: activeSource?.id ?? "",
    setActiveSourceId,
    activeSource,
    sourceDialog,
    reconnectSource,
    intakeMode,
    openSourceDialog,
    closeSourceDialog,
  };
}

type OntologyWorkspace = ReturnType<typeof useOntologyWorkspace>;

const OntologyContext = createContext<OntologyWorkspace | null>(null);

export function OntologyProvider({ children }: { children: ReactNode }) {
  const value = useOntologyWorkspace();
  return createElement(OntologyContext.Provider, { value }, children);
}

export function useOntologyDiscovery() {
  const value = useContext(OntologyContext);
  if (!value) {
    throw new Error("useOntologyDiscovery requiere OntologyProvider.");
  }
  return value;
}
