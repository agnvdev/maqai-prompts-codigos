import type { DiagnosticCheck } from "@/lib/serviceRoleDiagnostics";

// Plain server-rendered, no "use client" - purely informational display,
// no state, no actions, so there's nothing here that needs interactivity
// (and nothing that can fail the way a client component's own render
// could - see the #441 fix in this same route's page.tsx).
function CheckRow({ check }: { check: DiagnosticCheck }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-sm ${
        check.ok ? "border-accent/40 bg-accent/10" : "border-red-500/30 bg-red-500/10"
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        <span className={`h-2 w-2 shrink-0 rounded-full ${check.ok ? "bg-accent" : "bg-red-400"}`} />
        <span className={check.ok ? "text-accent" : "text-red-400"}>{check.label}</span>
        <span className="text-muted">: {check.status === "ok" ? "OK" : check.status.toUpperCase()}</span>
      </div>
      {!check.ok && check.message && (
        <p className="pl-4 text-xs text-muted">
          {check.message}
          {check.code && <span className="font-mono"> ({check.code})</span>}
        </p>
      )}
    </div>
  );
}

export function ServiceRoleDiagnosticsPanel({ checks }: { checks: DiagnosticCheck[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-sm font-bold text-foreground">Diagnóstico do service role</h2>
        <p className="text-xs text-muted">
          Checagens server-side, executadas a cada carregamento desta página. Nunca exibe o valor da
          service role, tokens, headers ou cookies - só etapa, mensagem e código quando houver falha.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {checks.map((check) => (
          <CheckRow key={check.label} check={check} />
        ))}
      </div>
    </div>
  );
}
