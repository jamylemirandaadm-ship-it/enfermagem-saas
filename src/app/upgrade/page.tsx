"use client";

import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const router = useRouter();

  const handleProClick = () => {
    // Eu deixo um canal simples por enquanto para a pessoa pedir ativacao do Pro.
    window.location.href = "mailto:?jamylemiranda59@gmail.com?subject=Quero%20o%20Plano%20Pro";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
      <div className="mx-auto w-full max-w-4xl py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Plano Pro</h1>
          <p className="text-zinc-300 text-base sm:text-lg">
            Desbloqueie uso ilimitado e recursos extras.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Free</h2>
            <ul className="space-y-2 text-zinc-300">
              <li>• 5 cálculos por dia (Calculadora e Gotejamento)</li>
              <li>• Histórico básico</li>
              <li>• Acesso às funções principais</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Pro</h2>
            <ul className="space-y-2 text-zinc-100">
              <li>• Cálculos ilimitados</li>
              <li>• Histórico completo</li>
              <li>• Acesso antecipado a novas ferramentas</li>
              <li>• Suporte/feedback prioritário</li>
            </ul>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
          <h3 className="text-xl font-semibold">Como assinar</h3>
          <p className="text-zinc-300">
            Assinatura em breve. Enquanto isso, fale comigo para ativar o Pro.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleProClick}
              className="rounded-xl bg-emerald-500 text-zinc-950 font-semibold px-4 py-2 hover:bg-emerald-400 transition-colors"
            >
              Quero o Pro
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Voltar
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
