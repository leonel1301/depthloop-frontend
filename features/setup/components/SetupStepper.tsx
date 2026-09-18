import { Check } from "lucide-react";
import Link from "next/link";

const steps = [
  { id: 1, href: "/setup/map", label: "Map" },
  { id: 2, href: "/setup/knowledge", label: "Negocio" },
  { id: 3, href: "/", label: "Inferir" },
] as const;

type Props = { current: 1 | 2 | 3 };

export function SetupStepper({ current }: Props) {
  return (
    <ol className="setup-stepper" aria-label="Pasos de configuración">
      {steps.map((step, index) => {
        const state = step.id < current ? "done" : step.id === current ? "current" : "upcoming";
        return (
          <li key={step.id} className={`setup-step setup-step-${state}`}>
            {index > 0 ? <span className="setup-step-line" aria-hidden="true" /> : null}
            <Link
              href={step.href}
              className="setup-step-link"
              aria-label={`${step.label}${state === "current" ? ", paso actual" : state === "done" ? ", completado" : ""}`}
              aria-current={state === "current" ? "step" : undefined}
              title={step.label}
            >
              <span className="setup-step-index">{state === "done" ? <Check size={12} strokeWidth={2.6} /> : step.id}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
