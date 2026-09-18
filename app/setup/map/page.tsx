"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/features/setup/components/AppHeader";
import { ConfirmationPanel, MapEmpty, UnderstandingCatalog, WorkspaceNav } from "@/features/ontology-discovery/components";
import type { WorkspaceView } from "@/features/ontology-discovery/components/WorkspaceNav";
import { useConfirmations, useOntologyDiscovery } from "@/features/ontology-discovery/hooks";

export default function SetupMapPage() {
  const {
    ready,
    ontology,
    querySources,
    confirmations: storedConfirmations,
    setConfirmations,
    hasSession,
    removeSource,
    openSourceDialog,
  } = useOntologyDiscovery();
  const persistConfirmations = useCallback((items: typeof storedConfirmations) => setConfirmations(items), [setConfirmations]);
  const { confirmations, reviewed, updateItem } = useConfirmations(ontology, storedConfirmations, persistConfirmations);
  const [selectedId, setSelectedId] = useState<string>();
  const [view, setView] = useState<WorkspaceView>("structure");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const selectNode = useCallback((id: string) => {
    setSelectedId(id);
    setView("structure");
  }, []);
  const activeId = selectedId ?? ontology?.entities[0]?.id;
  const pending = confirmations.length - reviewed;

  useEffect(() => {
    const intake = new URLSearchParams(window.location.search).get("intake");
    if (intake === "database" || intake === "service" || intake === "schema") {
      openSourceDialog("add", intake);
    }
  }, [openSourceDialog]);

  return (
    <main className="app-shell">
      <AppHeader currentStep={1} />

      {!ready ? null : ontology ? (
        <div className="app-body">
          <WorkspaceNav
            current={view}
            collapsed={navCollapsed}
            pending={pending}
            total={confirmations.length}
            reviewed={reviewed}
            confidence={ontology.metadata.totalConfidence}
            onSelect={setView}
            onToggle={() => setNavCollapsed((value) => !value)}
          />
          <div className="workspace-stage">
            {view === "structure" ? (
              <UnderstandingCatalog
                ontology={ontology}
                selectedId={activeId}
                onSelect={selectNode}
              />
            ) : (
              <ConfirmationPanel
                ontologyId={ontology.id}
                items={confirmations}
                reviewed={reviewed}
                selectedId={activeId}
                onSelect={selectNode}
                onUpdate={updateItem}
              />
            )}
          </div>
        </div>
      ) : (
        <MapEmpty
          connections={querySources}
          liveIds={querySources.filter((source) => hasSession(source.id)).map((source) => source.id)}
          onSchema={() => openSourceDialog("add", "schema")}
          onConnect={() => openSourceDialog("add", "database")}
          onRemove={removeSource}
        />
      )}
    </main>
  );
}
