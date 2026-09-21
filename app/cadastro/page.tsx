"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useLogoUrl } from "@/lib/useLogoUrl";
import { getSafeRedirect } from "@/lib/safeRedirect";
import { AuthShell } from "@/components/auth/AuthShell";

// Supabase returns technical, English, provider-specific error strings -
// translated here into short PT-BR messages instead of showing them raw.
function mapSignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "Este e-mail já está cadastrado. Tente entrar ou recuperar sua senha.";
  }
  if (lower.includes("password")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (lower.includes("email")) {
    return "Digite um e-mail válido.";
  }
  return "Não foi possível criar sua conta agora. Tente novamente em instantes.";
}

function CadastroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logoUrl = useLogoUrl();

  const redirectParam = searchParams.get("redirect");
  const loginHref = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : "/login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Digite seu nome.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const target = getSafeRedirect(redirectParam);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Captured by handle_new_user() into profiles.full_name (see
          // supabase/migrations/20260921120000_capture_full_name_on_signup.sql).
          data: { full_name: trimmedName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
        },
      });

      if (signUpError) {
        setError(mapSignUpError(signUpError.message));
        return;
      }

      if (data.session) {
        // Only reachable if email confirmation is ever turned off in the
        // Supabase dashboard - today it's on, so signUp never returns a
        // session immediately (verified directly against the project).
        router.replace(target);
        router.refresh();
        return;
      }

      setConfirmationSent(true);
    } catch (err) {
      console.error("Signup failed:", err);
      setError("Não foi possível criar sua conta agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <AuthShell title="Quase lá" subtitle="Falta só confirmar seu e-mail." logoUrl={logoUrl}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-foreground">
            Enviamos um link de confirmação para <span className="font-semibold">{email}</span>.
          </p>
          <p className="text-xs text-muted">
            Abra seu e-mail e clique no link para ativar sua conta. Depois é só entrar normalmente.
          </p>
          <Link
            href={loginHref}
            className="mt-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-accent/50"
          >
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Criar conta" subtitle="Comece a usar a MaqDesk." logoUrl={logoUrl}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Nome
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Senha
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          Confirmar senha
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50"
          />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="text-center text-xs text-muted">
          Já tem conta?{" "}
          <Link href={loginHref} className="font-semibold text-accent hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <CadastroForm />
    </Suspense>
  );
}
