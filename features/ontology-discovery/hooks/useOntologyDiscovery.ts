"use client";

import { useEffect, useRef, useState } from "react";
import type { ConfirmationItem } from "../models/confirmation";
import type { ConnectedSource, DbConnectionConfig, OntologyDiscoveryResult, SchemaSnapshot } from "../models/ontology";
import { ontologyApi } from "../services/ontologyApi";
import { queryApi } from "../services/queryApi";
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

export function useOntologyDiscovery() {
  const [businessId, setBusinessId] = useState("");
  const [sources, setSources] = useState<ConnectedSource[]>([]);
  const [querySources, setQuerySources] = useState<QuerySource[]>([]);
  const [ontology, setOntology] = useState<OntologyDiscoveryResult | null>(null);
  const [confirmations, setConfirmations] = useState<ConfirmationItem[]>([]);
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
        let nextSources = local.sources;
        let nextQuery = local.querySources;
        const remoteSources = await listRemoteSources();
        if (remoteSources.length) {
          const localById = new Map(nextQuery.map((source) => [source.id, source]));
          nextQuery = remoteSources.map((source) => localById.get(source.id) ?? source);
        }
        let nextConfirmations = local.confirmations;
        if (!nextOntology) {
          const remote = await ontologyApi.getCurrent(next);
          if (remote && (!remote.businessId || remote.businessId === next)) {
            nextOntology = remote;
            next = remote.businessId || next;
          }
        } else if (nextOntology.businessId && nextOntology.businessId !== next) {
          nextOntology = null;
          nextSources = [];
          nextQuery = [];
          nextConfirmations = [];
        } else if (!nextOntology.businessId) {
          nextOntology = { ...nextOntology, businessId: next };
        }
        setBusinessId(next);
        setOntology(nextOntology);
        setSources(nextSources);
        setQuerySources(nextQuery);
        setConfirmations(nextConfirmations);
        writeWorkspace({
          businessId: next,
          ontology: nextOntology,
          sources: nextSources,
          querySources: nextQuery,
          confirmations: nextConfirmations,
        });
      } finally {
        setReady(true);
      }
    };
    void boot();
  }, []);

  useEffect(() => {
    if (!ready || !businessId) return;
    writeWorkspace({ businessId, ontology, sources, querySources, confirmations });
  }, [ready, businessId, ontology, sources, querySources, confirmations]);

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
      void upsertRemoteSource({
        id: next.id,
        kind: "schema",
        label: next.label,
        engine: next.engine,
        config: { kind: "schema", host: "", port: 0, user: "", database: snapshot.source.name },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const discoverFromConnection = async (config: DbConnectionConfig, engine?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (config.kind === "service") {
        throw new Error("El conector de API aún no ejecuta consultas. Usa una base PostgreSQL para Inferir.");
      }
      const querySource = toQuerySource(config, engine);
      await queryApi.run(config, "select current_database() as database, current_user as db_user", businessId);
      writeSecret(querySource.id, { password: config.password, apiKey: config.apiKey });
      setQuerySources((current) => {
        const exists = current.some((source) => source.id === querySource.id);
        return exists ? current.map((source) => (source.id === querySource.id ? querySource : source)) : [...current, querySource];
      });
      void upsertRemoteSource(querySource);
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
      const snapshot = await queryApi.introspect(config, businessId);
      const result = await ontologyApi.discoverFromSchema({
        ...snapshot,
        source: { ...snapshot.source, businessId },
      });
      const stamped = { ...result, businessId: result.businessId || businessId };
      if (stamped.businessId && stamped.businessId !== businessId) setBusinessId(stamped.businessId);
      setOntology(stamped);
      setConfirmations([]);
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
    void deleteRemoteSource(sourceId);
  };

  return {
    businessId,
    ready,
    discoverFromSchema,
    discoverFromConnection,
    removeSource,
    ontology,
    isLoading,
    error,
    sources,
    querySources,
    confirmations,
    setConfirmations,
    setOntology,
    connectionForQuery,
    hasSession: (sourceId: string) => Boolean(readSecrets()[sourceId]?.password),
  };
}
