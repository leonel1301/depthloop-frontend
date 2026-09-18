import { BookOpenCheck, Check, MessageSquareText, Network } from "lucide-react";
import Link from "next/link";

const steps = [
  { id: 1, href: "/setup/map", label: "Map", detail: "Entender", icon: Network },
  { id: 2, href: "/setup/knowledge", label: "Negocio", detail: "Contextualizar", icon: BookOpenCheck },
  { id: 3, href: "/", label: "Inferir", detail: "Consultar", icon: MessageSquareText },
] as const;

type Props = { current: 1 | 2 | 3 };

export function SetupStepper({ current }: Props) {
  return (
    <ol className="setup-stepper" aria-label="Pasos de configuración">
      {steps.map((step, index) => {
        const state = step.id < current ? "done" : step.id === current ? "current" : "upcoming";
        const Icon = step.icon;
        return (
          <li key={step.id} className={`setup-step setup-step-${state}`}>
            {index > 0 ? <span className={`setup-step-line ${step.id <= current ? "active" : ""}`} aria-hidden="true"><i /></span> : null}
            <Link href={step.href} className="setup-step-link" aria-current={state === "current" ? "step" : undefined} title={step.label}>
              <span className="setup-step-index">
                {state === "done" ? <Check size={13} strokeWidth={2.6} /> : <Icon size={14} strokeWidth={2} />}
              </span>
              <span className="setup-step-copy">
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
