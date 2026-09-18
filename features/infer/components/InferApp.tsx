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

export function InferApp() {
  const router = useRouter();
  const { session } = useAuth();
  const { ready, businessId, ontology, querySources, hasSession, activeSource, openSourceDialog } = useOntologyDiscovery();
  const chat = useInferChat();
  const [navCollapsed, setNavCollapsed] = useState(false);
  const source = querySources.find((item) => item.id === activeSource?.id) ?? querySources[0];
  const connection = source ? connectionForQuery(source) : null;
  const live = Boolean(source && hasSession(source.id) && connection?.password);
  const setupPending = ready && !ontology;
  const blockedReason = !ready
    ? undefined
    : !source
      ? "Conecta una fuente para empezar."
      : !live
        ? "Vuelve a conectar la fuente desde Configuración."
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
            title={chat.threads.find((thread) => thread.id === chat.activeId)?.title ?? "Nueva conversación"}
            ontology={ontology}
            businessName={session.business.name}
            sources={querySources}
            liveIds={querySources.filter((item) => hasSession(item.id)).map((item) => item.id)}
            disabled={!live || !ontology}
            disabledReason={blockedReason}
            onSend={(question) => {
              if (!connection) return;
              void chat.send(question, connection, businessId);
            }}
          />
          <AgentRail />
        </div>
      )}
      <SourceToolbar showChrome={false} />
    </main>
  );
}
