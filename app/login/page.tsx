"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    setLoading(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setFormError("Email o contraseña incorrectos.");
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: undefined, data: {} },
      });
      if (error) {
        setFormError(error.message);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Supabase devuelve identities vacío cuando el email ya existe
        setFormError("Este email ya tiene cuenta. Entra directamente o usa Google si te registraste con él.");
      } else {
        setSuccess("Revisa tu email para confirmar la cuenta.");
      }
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="border-b-2 border-black px-4 sm:px-6 py-3 flex items-center">
        <a href="/" className="font-black text-xl tracking-tight mono hover:opacity-70 transition-opacity">
          MOCKMATE
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mono text-xs mb-3" style={{ color: "var(--red)" }}>— ACCESO</div>
            <h1 className="text-4xl font-black leading-none tracking-tighter mb-3">
              INICIA<br />SESIÓN.
            </h1>
            <p className="text-sm" style={{ color: "#555" }}>
              Guarda tu historial y accede desde cualquier dispositivo.
            </p>
          </div>

          {(error || formError) && (
            <div className="border-2 border-black px-4 py-3 mb-4 mono text-xs" style={{ background: "var(--red)", color: "white" }}>
              {formError || "Error al iniciar sesión. Inténtalo de nuevo."}
            </div>
          )}

          {success && (
            <div className="border-2 border-black px-4 py-3 mb-4 mono text-xs" style={{ background: "#22c55e", color: "white" }}>
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-2 border-black mb-0">
            <button
              onClick={() => setMode("login")}
              className="flex-1 py-2 mono text-xs font-bold transition-all"
              style={{ background: mode === "login" ? "var(--black)" : "white", color: mode === "login" ? "white" : "var(--black)" }}
            >
              ENTRAR
            </button>
            <button
              onClick={() => setMode("register")}
              className="flex-1 py-2 mono text-xs font-bold border-l-2 border-black transition-all"
              style={{ background: mode === "register" ? "var(--black)" : "white", color: mode === "register" ? "white" : "var(--black)" }}
            >
              REGISTRARSE
            </button>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="border-2 border-t-0 border-black bg-white mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="brutal-input w-full px-4 py-3 text-sm border-b-2 border-black"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="brutal-input w-full px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-bold text-sm uppercase tracking-widest border-t-2 border-black transition-all hover:opacity-80"
              style={{ background: "var(--black)", color: "white" }}
            >
              {loading ? "..." : mode === "login" ? "Entrar →" : "Crear cuenta →"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t-2 border-black" />
            <span className="mono text-xs opacity-40">O</span>
            <div className="flex-1 border-t-2 border-black" />
          </div>

          {/* Google button */}
          <div className="border-2 border-black bg-white">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 font-bold text-sm hover:bg-black hover:text-white transition-all group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
                <path style={{ fill: "#4285F4" }} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path style={{ fill: "#34A853" }} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path style={{ fill: "#FBBC05" }} d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path style={{ fill: "#EA4335" }} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar con Google
            </button>
          </div>

          <p className="mt-5 mono text-xs text-center" style={{ color: "#aaa" }}>
            Solo usamos tu cuenta para identificarte.
          </p>
        </div>
      </div>

      <div className="border-t-2 border-black px-4 sm:px-6 py-4">
        <span className="mono text-xs text-gray-400">MOCKMATE © 2026</span>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
