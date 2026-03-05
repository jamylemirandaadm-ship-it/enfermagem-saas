"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import { LimitCta } from "@/components/LimitCta";
import {
  FREE_DAILY_LIMIT,
  canUseApp,
  getDailyUsage,
  getFeatureCount,
  getUserAccess,
  hasReachedLimit,
  incrementDailyUsage,
  type AccessPlan,
  type DailyUsage,
} from "@/lib/daily-usage";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

type PediResult = {
  doseTotalMg: number;
  volumeMl: number;
};

function toNumber(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function format2(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function DosePediatricaPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [accessPlan, setAccessPlan] = useState<AccessPlan | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [result, setResult] = useState<PediResult | null>(null);
  const [uiMessage, setUiMessage] = useState<string | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [pesoKg, setPesoKg] = useState("");
  const [doseMgKg, setDoseMgKg] = useState("");
  const [concentracaoMgMl, setConcentracaoMgMl] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        try {
          setUid(user.uid);
          setLoadingUsage(true);

          // Eu carrego acesso e uso diario logo no login para deixar o estado de limite pronto.
          const [access, usage] = await Promise.all([
            getUserAccess(user.uid),
            getDailyUsage(user.uid),
          ]);

          setAccessPlan(access);
          setDailyUsage(usage);
        } catch {
          setUiMessage("Erro ao carregar seu acesso. Tente novamente em instantes.");
        } finally {
          setLoadingUsage(false);
        }
      }
    });

    return () => unsub();
  }, [router]);

  const formState = useMemo(() => {
    const peso = toNumber(pesoKg);
    const dose = toNumber(doseMgKg);
    const concentracao = toNumber(concentracaoMgMl);

    if (!pesoKg || !doseMgKg || !concentracaoMgMl) {
      return { ok: false as const, message: "Preencha todos os campos." };
    }

    if ([peso, dose, concentracao].some((value) => Number.isNaN(value))) {
      return { ok: false as const, message: "Use apenas numeros validos." };
    }

    if (peso <= 0 || dose <= 0 || concentracao <= 0) {
      return { ok: false as const, message: "Os valores precisam ser maiores que zero." };
    }

    return {
      ok: true as const,
      peso,
      dose,
      concentracao,
    };
  }, [pesoKg, doseMgKg, concentracaoMgMl]);

  const canUseFeature = canUseApp(accessPlan);
  const calculadoraCount = dailyUsage ? getFeatureCount(dailyUsage, "calculadora") : 0;
  const isLimitReached = hasReachedLimit(accessPlan, dailyUsage, "calculadora");

  const handleCalculate = async () => {
    if (!uid) {
      setUiMessage("Erro de sessao. Faca login novamente.");
      return;
    }
    if (!formState.ok) {
      setUiMessage(formState.message);
      return;
    }
    if (!accessPlan || !canUseApp(accessPlan)) {
      setUiMessage("Acesso inativo ou nao encontrado.");
      return;
    }

    try {
      setIsCalculating(true);
      setUiMessage(null);

      // Eu so incremento uso para Free; Pro ativa calcula sem consumir contador.
      if (!accessPlan.isPro) {
        const txResult = await incrementDailyUsage(uid, "calculadora", accessPlan);
        setDailyUsage(txResult.usage);

        if (txResult.status !== "incremented") {
          setResult(null);
          setUiMessage("Voce atingiu o limite diario da Calculadora no Plano Free.");
          return;
        }
      }

      const doseTotalMg = formState.peso * formState.dose;
      const volumeMl = doseTotalMg / formState.concentracao;

      setResult({ doseTotalMg, volumeMl });
      setUiMessage(null);
    } catch {
      setUiMessage("Erro ao calcular. Tente novamente.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!uid) {
      setUiMessage("Erro de sessao. Faca login novamente.");
      return;
    }
    if (!result) {
      setUiMessage("Calcule primeiro antes de salvar.");
      return;
    }

    try {
      setIsSaving(true);

      await addDoc(collection(db, "calculos"), {
        uid,
        tipo: "dose_pediatrica",
        dados: {
          pesoKg,
          doseMgKg,
          concentracaoMgMl,
        },
        resultado: {
          doseTotalMg: Number(result.doseTotalMg.toFixed(4)),
          volumeMl: Number(result.volumeMl.toFixed(4)),
        },
        createdAt: serverTimestamp(),
      });

      setUiMessage("Salvo no historico!");
    } catch {
      setUiMessage("Erro ao salvar no historico. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
        <h1 className="text-2xl font-bold">Dose Pediatrica</h1>
        <p className="text-sm text-zinc-300">Calculo mg/kg para mg total e mL.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Peso (kg)</label>
            <input
              className="w-full border border-zinc-700 bg-zinc-950 rounded p-2"
              placeholder="Ex: 12,5"
              value={pesoKg}
              onChange={(e) => setPesoKg(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Dose prescrita (mg/kg)</label>
            <input
              className="w-full border border-zinc-700 bg-zinc-950 rounded p-2"
              placeholder="Ex: 15"
              value={doseMgKg}
              onChange={(e) => setDoseMgKg(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Concentracao (mg/mL)</label>
            <input
              className="w-full border border-zinc-700 bg-zinc-950 rounded p-2"
              placeholder="Ex: 50"
              value={concentracaoMgMl}
              onChange={(e) => setConcentracaoMgMl(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-700 p-4 space-y-3">
          <LimitCta
            isPro={Boolean(accessPlan?.isPro)}
            canUseFeature={canUseFeature}
            count={calculadoraCount}
            limit={FREE_DAILY_LIMIT}
            isLimitReached={isLimitReached}
            uiMessage={uiMessage}
          />

          {result ? (
            <div className="space-y-1">
              <p>
                <span className="text-zinc-300">Dose total:</span>{" "}
                <strong>{format2(result.doseTotalMg)} mg</strong>
              </p>
              <p>
                <span className="text-zinc-300">Volume:</span>{" "}
                <strong>{format2(result.volumeMl)} mL</strong>
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-300">Preencha os campos e clique em Calcular.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/calculadoras")}
            className="flex-1 min-w-[140px] rounded p-2 bg-black text-white"
          >
            Voltar
          </button>

          <button
            onClick={() => {
              // Eu limpo o formulario para iniciar outro calculo sem recarregar a pagina.
              setPesoKg("");
              setDoseMgKg("");
              setConcentracaoMgMl("");
              setResult(null);
              setUiMessage(null);
            }}
            className="flex-1 min-w-[140px] rounded p-2 border border-zinc-700"
          >
            Limpar
          </button>

          <button
            onClick={handleCalculate}
            disabled={loadingUsage || isCalculating || !canUseFeature || isLimitReached}
            className="flex-1 min-w-[140px] rounded p-2 bg-blue-600 text-white disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {isLimitReached ? "Limite atingido" : isCalculating ? "Calculando..." : "Calcular"}
          </button>

          <button
            onClick={handleSave}
            disabled={!result || isSaving}
            className="flex-1 min-w-[140px] rounded p-2 bg-emerald-600 text-white disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {isSaving ? "Salvando..." : "Salvar no historico"}
          </button>
        </div>
      </div>
    </div>
  );
}
