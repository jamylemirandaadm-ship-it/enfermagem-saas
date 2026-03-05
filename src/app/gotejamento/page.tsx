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
  const [uiMessage, setUiMessage] = useState<string | null>(null);
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
          // Eu mostro o erro na tela para evitar pop-ups interrompendo o fluxo.
          setUiMessage("Erro ao carregar seu acesso. Tente novamente em instantes.");
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
    if (!uid) {
      setUiMessage("Erro de sessão. Faça login novamente.");
      return;
    }
    if (!formState.ok) {
      setUiMessage(formState.message);
      return;
    }
    if (!accessPlan || !canUseApp(accessPlan)) {
      setUiMessage("Acesso inativo ou não encontrado.");
      return;
    }

    try {
      setIsCalculating(true);
      setUiMessage(null);

      // Eu delego a validacao final do limite para a transacao porque ela protege contra cliques rapidos.
      const transactionResult = await incrementDailyUsage(uid, "gotejamento", accessPlan);

      setDailyUsage(transactionResult.usage);

      if (transactionResult.status !== "incremented") {
        // Eu mostro uma mensagem clara no estado da tela quando a transacao devolve limite atingido.
        setUiMessage("Você atingiu o limite diário do Gotejamento no Plano Free.");
        return;
      }

      // Eu so mostro o resultado depois que a transacao confirma que o uso foi consumido com sucesso.
      const mlHora = formState.volumeNumber / (formState.tempoNumber / 60);
      const gotasMin = (formState.volumeNumber * 20) / formState.tempoNumber;
      const microgotasMin = (formState.volumeNumber * 60) / formState.tempoNumber;

      setResult({ mlHora, gotasMin, microgotasMin });
      setUiMessage(null);
    } catch (e: any) {
      setUiMessage("Erro ao registrar o uso diário. Tente novamente.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!uid) {
      setUiMessage("Erro de sessão. Faça login novamente.");
      return;
    }
    if (!result) {
      setUiMessage("Calcule primeiro antes de salvar.");
      return;
    }

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

      setUiMessage("Cálculo salvo no histórico.");
    } catch (e: any) {
      setUiMessage("Erro ao salvar no histórico. Tente novamente.");
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
          <LimitCta
            isPro={Boolean(accessPlan?.isPro)}
            canUseFeature={canUseFeature}
            count={gotejamentoCount}
            limit={FREE_DAILY_LIMIT}
            isLimitReached={isLimitReached}
            uiMessage={uiMessage}
          />

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
            {isLimitReached ? "Limite atingido" : isCalculating ? "Calculando..." : "Calcular"}
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
