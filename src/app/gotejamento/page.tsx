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

export default function Gotejamento() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [accessPlan, setAccessPlan] = useState<AccessPlan | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [result, setResult] = useState<{
    mlHora: number;
    gotasMin: number;
    microgotasMin: number;
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const [volume, setVolume] = useState("");
  const [tempo, setTempo] = useState("");

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
    const vol = Number(volume);
    const t = Number(tempo);

    if (!volume || !tempo) {
      return { ok: false as const, message: "Preencha todos os campos." };
    }
    if (!Number.isFinite(vol) || !Number.isFinite(t)) {
      return { ok: false as const, message: "Use apenas numeros." };
    }
    if (vol <= 0 || t <= 0) {
      return { ok: false as const, message: "Os valores precisam ser maiores que zero." };
    }

    return {
      ok: true as const,
      volumeNumber: vol,
      tempoNumber: t,
    };
  }, [volume, tempo]);

  const canUseFeature = canUseApp(accessPlan);
  const gotejamentoCount = dailyUsage ? getFeatureCount(dailyUsage, "gotejamento") : 0;
  const isLimitReached = hasReachedLimit(accessPlan, dailyUsage, "gotejamento");

  const handleCalculate = async () => {
    if (!uid) return alert("Voce precisa estar logada.");
    if (!formState.ok) return alert("Preencha os campos corretamente antes de calcular.");
    if (!accessPlan || !canUseApp(accessPlan)) {
      return alert("Seu acesso esta inativo ou nao foi encontrado.");
    }

    try {
      setIsCalculating(true);

      // Eu delego a validacao final do limite para a transacao porque ela protege contra cliques rapidos.
      const transactionResult = await incrementDailyUsage(uid, "gotejamento", accessPlan);

      setDailyUsage(transactionResult.usage);

      if (transactionResult.status !== "incremented") {
        return alert("Voce atingiu o limite diario de gotejamento no plano Free.");
      }

      // Eu so mostro o resultado depois que a transacao confirma que o uso foi consumido com sucesso.
      const mlHora = formState.volumeNumber / (formState.tempoNumber / 60);
      const gotasMin = (formState.volumeNumber * 20) / formState.tempoNumber;
      const microgotasMin = (formState.volumeNumber * 60) / formState.tempoNumber;

      setResult({ mlHora, gotasMin, microgotasMin });
    } catch (e: any) {
      alert("Erro ao registrar o uso diario: " + e.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!uid) return alert("Você precisa estar logada.");
    if (!result) return alert("Preencha os campos corretamente antes de salvar.");

    try {
      await addDoc(collection(db, "calculos"), {
        uid,
        tipo: "gotejamento",
        volumeMl: volume,
        tempoMin: tempo,
        mlHora: Number(result.mlHora.toFixed(4)),
        gotasMin: Number(result.gotasMin.toFixed(4)),
        microgotasMin: Number(result.microgotasMin.toFixed(4)),
        createdAt: serverTimestamp(),
      });

      alert("Gotejamento salvo no histórico ✅");
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">Cálculo de Gotejamento</h1>

        <input
          className="w-full border p-2 rounded"
          placeholder="Volume total (mL)"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          inputMode="decimal"
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Tempo (min)"
          value={tempo}
          onChange={(e) => setTempo(e.target.value)}
          inputMode="decimal"
        />

        <div className="border rounded p-4 space-y-2">
          {!canUseFeature ? (
            <p className="text-sm text-red-600">Acesso inativo ou nao encontrado.</p>
          ) : accessPlan?.isPro ? (
            <p className="text-sm text-green-700">Plano Pro ativo: uso ilimitado.</p>
          ) : (
            <p className="text-sm text-gray-700">
              Plano Free: {gotejamentoCount}/{FREE_DAILY_LIMIT} usos hoje.
            </p>
          )}

          {result ? (
            <>
              <p>
                <strong>mL/h:</strong> {result.mlHora.toFixed(2)}
              </p>
              <p>
                <strong>Gotas/min (20):</strong> {result.gotasMin.toFixed(0)}
              </p>
              <p>
                <strong>Microgotas/min (60):</strong> {result.microgotasMin.toFixed(0)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-700">Preencha os campos e clique em Calcular.</p>
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
            className="flex-1 bg-blue-600 text-white rounded p-2 disabled:bg-gray-300 disabled:text-gray-600"
            onClick={handleCalculate}
            disabled={loadingUsage || isCalculating || !canUseFeature || isLimitReached}
          >
            {isCalculating ? "Calculando..." : "Calcular"}
          </button>

          <button
            className="flex-1 bg-blue-600 text-white rounded p-2 disabled:bg-gray-300 disabled:text-gray-600"
            onClick={handleSave}
            disabled={!result}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
