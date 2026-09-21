"use client";

import { Bot, Plus } from "lucide-react";
import { useI18n } from "@/features/i18n";

export function AgentRail() {
  const { t } = useI18n();
  return (
    <aside className="agent-rail" aria-label={t("infer.agents")}>
      <div className="agent-rail-head">
        <span className="agent-mark" aria-hidden="true">
          <Bot size={16} />
        </span>
        <div>
          <h2>{t("infer.agents")}</h2>
          <span>{t("infer.comingSoon")}</span>
        </div>
      </div>
      <div className="agent-empty">
        <span><Plus size={15} /></span>
        <strong>{t("infer.supportTitle")}</strong>
        <p>{t("infer.supportCopy")}</p>
      </div>
    </aside>
  );
}
