"use client";

import { useRouter } from "next/navigation";

type ToolStatus = "available" | "soon";

type ToolItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  status: ToolStatus;
  badge?: string;
  icon?: string;
};

const TOOLS: ToolItem[] = [
  {
    id: "calculadora_medicacao",
    title: "Calculadora de Medicacao",
    description: "Regra de 3 mg -> mL",
    href: "/calculadora",
    status: "available",
    badge: "Mais usado",
    icon: "🧮",
  },
  {
    id: "gotejamento",
    title: "Gotejamento",
    description: "mL/h, gotas/min e microgotas/min",
    href: "/gotejamento",
    status: "available",
    icon: "💧",
  },
  {
    id: "diluicao_reconstituicao",
    title: "Diluicao e reconstituicao",
    description: "Concentracao final, volume a aspirar e ajuste de volume final",
    href: "/diluicao",
    status: "available",
    icon: "🧪",
  },
  {
    id: "dose_pediatrica",
    title: "Dose Pediatrica",
    description: "Calculo mg/kg -> mg e mL",
    href: "/dose-pediatrica",
    status: "available",
    badge: "Novo",
    icon: "👶",
  },
  {
    id: "conversoes",
    title: "Conversoes",
    description: "Conversoes de medidas e unidades clinicas",
    href: "/calculadoras",
    status: "soon",
    icon: "🔁",
  },
];

export default function CalculadorasHubPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
      <div className="mx-auto w-full max-w-5xl py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Calculadoras</h1>
          <p className="text-zinc-300 text-base sm:text-lg">
            Ferramentas rapidas para o dia a dia e estudos
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOOLS.map((tool) => {
            const isSoon = tool.status === "soon";

            return (
              <article
                key={tool.id}
                role={isSoon ? undefined : "button"}
                tabIndex={isSoon ? undefined : 0}
                onClick={
                  isSoon
                    ? undefined
                    : () => {
                        // Eu deixo o card inteiro clicavel para reduzir cliques no mobile.
                        router.push(tool.href);
                      }
                }
                onKeyDown={
                  isSoon
                    ? undefined
                    : (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(tool.href);
                        }
                      }
                }
                className={`rounded-2xl border p-6 space-y-4 transition ${
                  isSoon
                    ? "border-zinc-800 bg-zinc-900/40 opacity-65"
                    : "border-zinc-800 bg-zinc-900/70 cursor-pointer hover:border-emerald-400/50"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400">{tool.icon ?? "🧠"} Ferramenta</p>
                  <h2 className="text-xl font-semibold">{tool.title}</h2>
                  <p className="text-sm text-zinc-300">{tool.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {tool.badge && (
                    <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-xs">
                      {tool.badge}
                    </span>
                  )}
                  {isSoon && (
                    <span className="inline-flex rounded-full bg-zinc-800 text-zinc-300 px-2 py-0.5 text-xs">
                      Em breve
                    </span>
                  )}
                </div>

                {isSoon ? (
                  <button
                    disabled
                    className="inline-flex rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-500 cursor-not-allowed"
                  >
                    Em breve
                  </button>
                ) : (
                  <button
                    // Eu mantenho a navegacao do hub por push para seguir o mesmo padrao das outras telas.
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(tool.href);
                    }}
                    className="inline-flex rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
                  >
                    Abrir
                  </button>
                )}
              </article>
            );
          })}
        </section>

        <div>
          <button
            // Eu mantenho o retorno para o dashboard como saida rapida do hub.
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
