"use client";

import { useEffect, useState } from "react";
import { ontologyApi } from "@/features/ontology-discovery/services/ontologyApi";

type Version = {
  version: number;
  ontologyId: string;
  status: string;
  isCurrent: boolean;
  changeNote: string | null;
  createdAt: string;
};

type Props = {
  businessId: string;
  onRestored: (ontology: Awaited<ReturnType<typeof ontologyApi.rollback>>) => void;
};

export function MapHistory({ businessId, onRestored }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ontologyApi.listVersions(businessId).then((items) => {
      if (!cancelled) setVersions(items);
    });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const restore = async (version: number) => {
    setError(null);
    setLoading(true);
    try {
      const document = await ontologyApi.rollback(businessId, version);
      setVersions((current) =>
        current.map((item) => ({ ...item, isCurrent: item.version === version })),
      );
      onRestored(document);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo restaurar esa versión.");
    } finally {
      setLoading(false);
    }
  };

  if (!versions.length) {
    return <p className="muted-copy">Cuando confirmes un mapa, aquí quedará el historial para rollback.</p>;
  }

  return (
    <div className="map-history">
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <ul>
        {versions.map((item) => (
          <li key={item.version}>
            <div>
              <strong>v{item.version}</strong>
              <span>{item.isCurrent ? "Actual" : item.status}</span>
              <small>{new Date(item.createdAt).toLocaleString("es")}</small>
            </div>
            {item.isCurrent ? null : (
              <button className="ghost-button" type="button" disabled={loading} onClick={() => void restore(item.version)}>
                Restaurar
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
