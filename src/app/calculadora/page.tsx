"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
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

function toNumber(value: string) {
  const normalized = value.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

export default function CalculadoraMedicacao() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [accessPlan, setAccessPlan] = useState<AccessPlan | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [resultMl, setResultMl] = useState<number | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const [doseMg, setDoseMg] = useState("");
  const [concMg, setConcMg] = useState("");
  const [volMl, setVolMl] = useState("");

  // Protege rota + pega UID
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        try {
          setUid(user.uid);
          setLoadingUsage(true);

          // Eu carrego acesso e uso diario depois do login para decidir se libero ou bloqueio o calcular.
          const [access, usage] = await Promise.all([
            getUserAccess(user.uid),
            getDailyUsage(user.uid),
          ]);

          setAccessPlan(access);
          setDailyUsage(usage);
        } catch (e: any) {
          alert("Erro ao carregar seu acesso: " + e.message);
        } finally {
          setLoadingUsage(false);
        }
      }
    });

    return () => unsub();
  }, [router]);

  const formState = useMemo(() => {
    const dose = toNumber(doseMg);
    const conc = toNumber(concMg);
    const vol = toNumber(volMl);

    if (!doseMg || !concMg || !volMl) {
      return { ok: false as const, message: "Preencha todos os campos." };
    }

    if ([dose, conc, vol].some((x) => Number.isNaN(x))) {
      return { ok: false as const, message: "Use apenas números." };
    }

    if (conc <= 0 || vol <= 0 || dose <= 0) {
      return { ok: false as const, message: "Os valores precisam ser maiores que zero." };
    }

    return { ok: true as const, dose, conc, vol };
  }, [doseMg, concMg, volMl]);

  const canUseFeature = canUseApp(accessPlan);
  const calculadoraCount = dailyUsage ? getFeatureCount(dailyUsage, "calculadora") : 0;
  const isLimitReached = hasReachedLimit(accessPlan, dailyUsage, "calculadora");

  const handleCalculate = async () => {
    if (!uid) return alert("Voce precisa estar logada.");
    if (!formState.ok) return alert("Preencha os campos corretamente antes de calcular.");
    if (!accessPlan || !canUseApp(accessPlan)) {
      return alert("Seu acesso esta inativo ou nao foi encontrado.");
    }

    try {
      setIsCalculating(true);

      // Eu delego a validacao final do limite para a transacao porque ela protege contra cliques rapidos.
      const transactionResult = await incrementDailyUsage(uid, "calculadora", accessPlan);

      setDailyUsage(transactionResult.usage);

      if (transactionResult.status !== "incremented") {
        return alert("Voce atingiu o limite diario da calculadora no plano Free.");
      }

      // Eu so mostro o resultado depois que a transacao confirma que o uso foi consumido com sucesso.
      const ml = (formState.dose * formState.vol) / formState.conc;
      setResultMl(ml);
    } catch (e: any) {
      alert("Erro ao registrar o uso diario: " + e.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!uid) return alert("Você precisa estar logada.");
    if (resultMl === null) return alert("Calcule primeiro antes de salvar.");

    try {
      await addDoc(collection(db, "calculos"), {
        uid,
        tipo: "regra_de_tres_mg_ml",
        doseMg,
        concMg,
        volMl,
        resultadoMl: Number(resultMl.toFixed(4)),
        createdAt: serverTimestamp(),
      });

      alert("Salvo no histórico ✅");
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border p-6 space-y-4">
        <h1 className="text-2xl font-bold">Calculadora de Medicação</h1>
        <p className="text-sm text-gray-600">
          Regra de 3 (mg → mL). Ex.: “Prescrito 250mg. Frasco 500mg em 2mL”.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Dose prescrita (mg)</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Ex: 250"
              value={doseMg}
              onChange={(e) => setDoseMg(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Concentração disponível (mg)</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Ex: 500"
              value={concMg}
              onChange={(e) => setConcMg(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Volume disponível (mL)</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Ex: 2"
              value={volMl}
              onChange={(e) => setVolMl(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          {!canUseFeature ? (
            <p className="text-sm text-red-600">Acesso inativo ou nao encontrado.</p>
          ) : accessPlan?.isPro ? (
            <p className="text-sm text-green-700">Plano Pro ativo: uso ilimitado.</p>
          ) : (
            <p className="text-sm text-gray-700">
              Plano Free: {calculadoraCount}/{FREE_DAILY_LIMIT} usos hoje.
            </p>
          )}

          {resultMl === null ? (
            <p className="text-sm text-gray-700">Preencha os campos e clique em Calcular.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Volume a administrar:</p>
              <p className="text-3xl font-bold">{resultMl.toFixed(2)} mL</p>
              <p className="text-xs text-gray-500">
                * Conferir sempre com protocolo/posologia. Ferramenta de apoio ao estudo.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className="flex-1 bg-black text-white rounded p-2"
            onClick={() => router.push("/dashboard")}
          >
            Voltar
          </button>

          <button
            className="flex-1 border rounded p-2"
            onClick={() => {
              setDoseMg("");
              setConcMg("");
              setVolMl("");
              setResultMl(null);
            }}
          >
            Limpar
          </button>

          <button
            className="flex-1 bg-blue-600 text-white rounded p-2 disabled:bg-gray-300 disabled:text-gray-600"
            onClick={handleCalculate}
            disabled={loadingUsage || isCalculating || !canUseFeature || isLimitReached}
          >
            {isCalculating ? "Calculando..." : "Calcular"}
          </button>

          <button
            className="flex-1 bg-blue-600 text-white rounded p-2 disabled:bg-gray-300 disabled:text-gray-600"
            onClick={handleSave}
            disabled={resultMl === null}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
