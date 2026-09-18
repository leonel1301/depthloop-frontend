"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MessageSquareText, Settings } from "lucide-react";
import { SetupStepper } from "./SetupStepper";
import { CompanyBrand } from "@/features/auth/components/CompanyBrand";
import { UserProfile } from "@/features/auth/components/UserProfile";
import { SourceToolbar } from "@/features/ontology-discovery/components/SourceToolbar";
import { useOntologyDiscovery } from "@/features/ontology-discovery/hooks";

type Props = {
  currentStep?: 1 | 2 | 3;
  extras?: ReactNode;
};

export function AppHeader({ currentStep, extras }: Props) {
  const setup = currentStep != null;
  const { ready, ontology } = useOntologyDiscovery();
  const showChat = ready && (!setup || Boolean(ontology));

  return (
    <header className="app-header">
      <div className={`topbar ${setup ? "" : "app-topbar"}`}>
        <div className="header-identity">
          <div className="header-workspace">
            <span>Empresa</span>
            <CompanyBrand />
          </div>
          {setup || showChat ? (
            <>
              <span className="header-identity-divider" aria-hidden="true" />
              <div className="header-cluster" aria-label="Navegación">
                {setup ? (
                  <Link className="header-reveal header-reveal-settings" href="/settings" aria-label="Configuración">
                    <Settings size={16} aria-hidden="true" />
                    <span>Configuración</span>
                  </Link>
                ) : null}
                {showChat ? (
                  <Link className="header-reveal" href="/" aria-label="Volver al chat">
                    <MessageSquareText size={16} aria-hidden="true" />
                    <span>Volver al chat</span>
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
        {setup ? (
          <div className="setup-stepper-wrap">
            <SetupStepper current={currentStep} />
          </div>
        ) : null}
        <div className="topbar-actions">
          <div className="header-cluster" aria-label="Fuentes">
            <SourceToolbar />
          </div>
          {extras ? (
            <>
              <span className="header-cluster-rule" aria-hidden="true" />
              <div className="header-cluster">{extras}</div>
            </>
          ) : null}
          <span className="header-cluster-rule" aria-hidden="true" />
          <div className="header-cluster" aria-label="Cuenta">
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
