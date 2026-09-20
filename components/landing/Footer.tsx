import { Brand } from "@/components/ui/Brand";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 sm:px-6">
        <Brand />
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} MaqDesk. Plataforma de IA para o setor pesado.
        </p>
      </div>
    </footer>
  );
}
