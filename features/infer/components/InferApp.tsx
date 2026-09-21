"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentRail } from "./AgentRail";
import { InferChat } from "./InferChat";
import { InferNav } from "./InferNav";
import { useInferChat } from "../hooks/useInferChat";
import { SourceToolbar } from "@/features/ontology-discovery/components/SourceToolbar";
import { useOntologyDiscovery } from "@/features/ontology-discovery/hooks";
import { connectionForQuery } from "@/features/ontology-discovery/services/workspaceStore";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n";
import { useWorkspaceTools } from "@/features/tools/hooks/useWorkspaceTools";

export function InferApp() {
  const { t } = useI18n();
  const router = useRouter();
  const { session } = useAuth();
  const { ready, businessId, ontology, publishedOntology, querySources, hasSession, activeSource, openSourceDialog } = useOntologyDiscovery();
  const chat = useInferChat();
  const workspaceTools = useWorkspaceTools();
  const [navCollapsed, setNavCollapsed] = useState(false);
  const publishedSource = publishedOntology?.source;
  const source = querySources.find((item) =>
    item.id === publishedSource?.id
    || item.config.database === publishedSource?.id
    || item.config.database === publishedSource?.name
  ) ?? querySources.find((item) => item.id === activeSource?.id) ?? querySources[0];
  const connection = source ? connectionForQuery(source) : null;
  const live = Boolean(source && hasSession(source.id) && connection?.password);
  const setupPending = ready && !ontology;
  const blockedReason = !ready
    ? undefined
    : !source
      ? t("infer.connectSource")
      : !live
        ? t("infer.reconnect")
        : !publishedOntology
          ? t("infer.publishMap")
        : undefined;

  useEffect(() => {
    if (setupPending) router.replace("/setup/map");
  }, [setupPending, router]);

  return (
    <main className="app-shell infer-shell">
      {!ready || !chat.ready || setupPending ? null : (
        <div className="infer-app">
          <InferNav
            collapsed={navCollapsed}
            businessId={businessId}
            threads={chat.threads}
            activeId={chat.activeId}
            onToggle={() => setNavCollapsed((value) => !value)}
            onAdd={() => openSourceDialog("add", "database")}
            onCreateChat={chat.createChat}
            onSelect={chat.selectChat}
            onRemove={chat.removeChat}
          />
          <InferChat
            messages={chat.messages}
            loading={chat.loading}
            error={chat.error}
            title={chat.threads.find((thread) => thread.id === chat.activeId)?.title ?? t("infer.newChat")}
            ontology={publishedOntology}
            businessName={session.business.name}
            sources={querySources}
            liveIds={querySources.filter((item) => hasSession(item.id)).map((item) => item.id)}
            tools={workspaceTools.selectedTools}
            disabled={!live || !publishedOntology}
            disabledReason={blockedReason}
            onSend={(question, preferredTools) => {
              if (!connection) return;
              if (!source) return;
              void chat.send(question, connection, source.id, businessId, preferredTools);
            }}
          />
          <AgentRail />
        </div>
      )}
      <SourceToolbar showChrome={false} />
    </main>
  );
}
