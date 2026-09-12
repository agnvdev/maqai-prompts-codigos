import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex flex-col leading-none">
      <span className="text-xl font-bold tracking-[-0.02em] text-foreground">
        Maq<span className="text-accent transition-colors group-hover:text-accent/80">AI</span>
      </span>
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">
        Prompts e Códigos
      </span>
    </Link>
  );
}
