"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AccesoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (next.startsWith("http") || next.startsWith("//")) {
      router.replace("/");
    }
  }, [next, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true); setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { router.replace(next); }
      else { const data = await res.json(); setError(data.error ?? "Contraseña incorrecta"); }
    } catch { setError("Error de conexión"); }
    finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="text-4xl">🍳</span>
        <h1 className="mt-3 text-2xl font-bold">Fulse</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ingresa la contraseña para continuar
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="text-center" autoFocus />
        <Button type="submit" disabled={loading || !password.trim()} className="w-full h-11">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Verificando...</> : <><Lock className="h-4 w-4" />Entrar</>}
        </Button>
        {error && <p className="text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>
    </div>
  );
}

export default function AccesoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Suspense fallback={<div className="text-zinc-400">Cargando...</div>}>
        <AccesoForm />
      </Suspense>
    </div>
  );
}
