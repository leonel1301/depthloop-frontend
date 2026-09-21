"use client";

import { Boxes, Check, Database, FileJson, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/features/i18n";

export function AuthMap() {
  const { t } = useI18n();

  return (
    <div className="auth-map" aria-hidden="true">
      <div className="auth-map-grid" />

      <div className="auth-map-line auth-map-line-sales"><i /></div>
      <div className="auth-map-line auth-map-line-clients"><i /></div>
      <div className="auth-map-line auth-map-line-ops"><i /></div>
      <div className="auth-map-line auth-map-line-result"><i /></div>

      <div className="auth-data-node auth-data-node-sales">
        <span className="auth-data-icon"><Database size={15} /></span>
        <span><strong>{t("auth.mapSales")}</strong><small>{t("auth.mapSalesHint")}</small></span>
        <Check size={13} className="auth-data-check" />
      </div>

      <div className="auth-data-node auth-data-node-clients">
        <span className="auth-data-icon"><FileJson size={15} /></span>
        <span><strong>{t("auth.mapClients")}</strong><small>{t("auth.mapClientsHint")}</small></span>
        <Check size={13} className="auth-data-check" />
      </div>

      <div className="auth-data-node auth-data-node-ops">
        <span className="auth-data-icon"><Boxes size={15} /></span>
        <span><strong>{t("auth.mapOps")}</strong><small>{t("auth.mapOpsHint")}</small></span>
        <Check size={13} className="auth-data-check" />
      </div>

      <div className="auth-map-core">
        <span className="auth-map-core-mark">
          <Image src="/nuudo-icon.png" alt="" width={42} height={42} unoptimized />
        </span>
        <span className="auth-map-core-copy">
          <small>{t("auth.mapCompany")}</small>
          <strong>{t("auth.mapConnectedInfo")}</strong>
        </span>
        <span className="auth-map-core-status"><i /> {t("auth.mapConnected")}</span>
        <span className="auth-map-core-progress"><i /></span>
        <span className="auth-map-core-meta">{t("auth.mapConcepts")}</span>
      </div>

      <div className="auth-map-result">
        <span className="auth-map-result-icon"><ShieldCheck size={17} /></span>
        <span><strong>{t("auth.mapVision")}</strong><small>{t("auth.mapReady")}</small></span>
      </div>
    </div>
  );
}
