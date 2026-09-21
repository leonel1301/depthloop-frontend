"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MessageSquareText, Settings } from "lucide-react";
import { SetupStepper } from "./SetupStepper";
import { CompanyBrand } from "@/features/auth/components/CompanyBrand";
import { UserProfile } from "@/features/auth/components/UserProfile";
import { SourceToolbar } from "@/features/ontology-discovery/components/SourceToolbar";
import { useI18n } from "@/features/i18n";
import { useOntologyDiscovery } from "@/features/ontology-discovery/hooks";

type Props = {
  currentStep?: 1 | 2 | 3 | 4;
  extras?: ReactNode;
};

export function AppHeader({ currentStep, extras }: Props) {
  const { t } = useI18n();
  const setup = currentStep != null;
  const { ready, ontology } = useOntologyDiscovery();
  const showChat = ready && (!setup || (currentStep !== 4 && Boolean(ontology)));

  return (
    <header className="app-header">
      <div className={`topbar ${setup ? "" : "app-topbar"}`}>
        <div className="header-identity">
          <div className="header-workspace">
            <span>{t("common.company")}</span>
            <CompanyBrand />
          </div>
          {setup || showChat ? (
            <>
              <span className="header-identity-divider" aria-hidden="true" />
              <div className="header-cluster" aria-label={t("common.navigation")}>
                {setup ? (
                  <Link className="header-reveal header-reveal-settings" href="/settings" aria-label={t("header.settings")}>
                    <Settings size={16} aria-hidden="true" />
                    <span>{t("header.settings")}</span>
                  </Link>
                ) : null}
                {showChat ? (
                  <Link className="header-reveal" href="/" aria-label={t("header.backToChat")}>
                    <MessageSquareText size={16} aria-hidden="true" />
                    <span>{t("header.backToChat")}</span>
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
          <div className="header-cluster" aria-label={t("common.sources")}>
            <SourceToolbar />
          </div>
          {extras ? (
            <>
              <span className="header-cluster-rule" aria-hidden="true" />
              <div className="header-cluster">{extras}</div>
            </>
          ) : null}
          <span className="header-cluster-rule" aria-hidden="true" />
          <div className="header-cluster" aria-label={t("common.account")}>
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
