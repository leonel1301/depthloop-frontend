"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { SetupStepper } from "./SetupStepper";
import { ThemeToggle } from "./ThemeToggle";
import { CompanyBrand } from "@/features/auth/components/CompanyBrand";
import { UserProfile } from "@/features/auth/components/UserProfile";

type Props = {
  currentStep?: 1 | 2 | 3;
  extras?: ReactNode;
};

export function AppHeader({ currentStep, extras }: Props) {
  const setup = currentStep != null;
  return (
    <header className="app-header">
      <div className={`topbar ${setup ? "" : "app-topbar"}`}>
        <div className="header-identity">
          <Link href="/" className="depthloop-brand" aria-label="DepthLoop">
            <Image src="/depthloop-icon-v2.png" alt="" width={30} height={30} unoptimized />
            <strong>DepthLoop</strong>
          </Link>
          <span className="header-identity-divider" aria-hidden="true" />
          <div className="header-workspace">
            <span>Empresa</span>
            <CompanyBrand />
          </div>
        </div>
        {setup ? (
          <div className="setup-stepper-wrap">
            <SetupStepper current={currentStep} />
          </div>
        ) : null}
        <div className="topbar-actions">
          {extras}
          {setup ? (
            <span className="readonly-status" title="DepthLoop solo consulta tus fuentes">
              <ShieldCheck size={14} />
              <span>Solo lectura</span>
            </span>
          ) : null}
          <ThemeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
