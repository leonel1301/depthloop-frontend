"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/features/i18n";
import { ontologyApi } from "@/features/ontology-discovery/services/ontologyApi";

type Version = {
  version: number;
  ontologyId: string;
  status: string;
  isCurrent: boolean;
  isPublished: boolean;
  changeNote: string | null;
  createdAt: string;
};

type Props = {
  businessId: string;
  onRestored: (ontology: Awaited<ReturnType<typeof ontologyApi.rollback>>) => void;
};

export function MapHistory({ businessId, onRestored }: Props) {
  const { t, locale } = useI18n();
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
      setError(caught instanceof Error ? caught.message : t("history.restoreError"));
    } finally {
      setLoading(false);
    }
  };

  if (!versions.length) {
    return <p className="muted-copy">{t("history.empty")}</p>;
  }

  return (
    <div className="map-history">
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <ul>
        {versions.map((item) => (
          <li key={item.version}>
            <div>
              <strong>v{item.version}</strong>
              <span>{item.isPublished ? t("history.published") : item.isCurrent ? t("history.draft") : item.status}</span>
              <small>{new Date(item.createdAt).toLocaleString(locale === "en" ? "en" : "es")}</small>
            </div>
            {item.isCurrent ? null : (
              <button className="ghost-button" type="button" disabled={loading} onClick={() => void restore(item.version)}>
                {t("history.restore")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
