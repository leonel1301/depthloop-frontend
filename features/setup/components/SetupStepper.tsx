"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/features/i18n";

type Props = { current: 1 | 2 | 3 | 4 };

export function SetupStepper({ current }: Props) {
  const { t } = useI18n();
  const steps = [
    { id: 1, href: "/setup/map", label: t("stepper.map") },
    { id: 2, href: "/setup/knowledge", label: t("stepper.business") },
    { id: 3, href: "/setup/tools", label: t("stepper.tools") },
    { id: 4, href: "/setup/chat", label: t("stepper.infer") },
  ] as const;

  return (
    <ol className="setup-stepper" aria-label={t("stepper.label")}>
      {steps.map((step, index) => {
        const state = step.id < current ? "done" : step.id === current ? "current" : "upcoming";
        return (
          <li key={step.id} className={`setup-step setup-step-${state}`}>
            {index > 0 ? <span className="setup-step-line" aria-hidden="true" /> : null}
            <Link
              href={step.href}
              className="setup-step-link"
              aria-label={`${step.label}${state === "current" ? `, ${t("stepper.current")}` : state === "done" ? `, ${t("stepper.done")}` : ""}`}
              aria-current={state === "current" ? "step" : undefined}
              title={step.label}
            >
              <span className="setup-step-index">{state === "done" ? <Check size={11} strokeWidth={2.6} /> : step.id}</span>
              <strong className="setup-step-label">{step.label}</strong>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
