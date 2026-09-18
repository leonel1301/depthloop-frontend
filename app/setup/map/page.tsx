"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/features/setup/components/AppHeader";
import { ConfirmationPanel, MapEmpty, SourceToolbar, UnderstandingCatalog, WorkspaceNav } from "@/features/ontology-discovery/components";
import type { IntakeMode } from "@/features/ontology-discovery/components/DbConnector";
import type { WorkspaceView } from "@/features/ontology-discovery/components/WorkspaceNav";
import { useConfirmations, useOntologyDiscovery } from "@/features/ontology-discovery/hooks";

export default function SetupMapPage() {
  const {
    businessId,
    ready,
    discoverFromSchema,
    discoverFromConnection,
    ontology,
    isLoading,
    error,
    sources,
    querySources,
    confirmations: storedConfirmations,
    setConfirmations,
    hasSession,
    removeSource,
  } = useOntologyDiscovery();
  const persistConfirmations = useCallback((items: typeof storedConfirmations) => setConfirmations(items), [setConfirmations]);
  const { confirmations, reviewed, updateItem } = useConfirmations(ontology, storedConfirmations, persistConfirmations);
  const [selectedId, setSelectedId] = useState<string>();
  const [dialog, setDialog] = useState<"add" | "manage" | null>(null);
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("schema");
  const [view, setView] = useState<WorkspaceView>("structure");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const selectNode = useCallback((id: string) => {
    setSelectedId(id);
    setView("structure");
  }, []);
  const activeId = selectedId ?? ontology?.entities[0]?.id;
  const pending = confirmations.length - reviewed;
  const openDialog = (mode: "add" | "manage", intake: IntakeMode = "schema") => {
    setIntakeMode(intake);
    setDialog(mode);
  };

  useEffect(() => {
    const intake = new URLSearchParams(window.location.search).get("intake");
    if (intake === "database" || intake === "service" || intake === "schema") {
      setIntakeMode(intake);
      setDialog("add");
    }
  }, []);

  return (
    <main className="app-shell">
      <AppHeader
        currentStep={1}
        extras={
          <SourceToolbar
            sources={sources}
            businessId={businessId}
            isLoading={isLoading}
            error={error}
            dialog={dialog}
            intakeMode={intakeMode}
            onOpen={openDialog}
            onClose={() => setDialog(null)}
            onSubmitConnection={discoverFromConnection}
            onSubmitSchema={discoverFromSchema}
            querySources={querySources}
            liveIds={querySources.filter((source) => hasSession(source.id)).map((source) => source.id)}
            onRemove={removeSource}
            showChrome
          />
        }
      />

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
          onSchema={() => openDialog("add", "schema")}
          onConnect={() => openDialog("add", "database")}
          onRemove={removeSource}
        />
      )}
    </main>
  );
}
