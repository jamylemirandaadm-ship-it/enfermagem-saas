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

type DiluicaoResult = {
  concentracaoMgMl: number;
  volumeAspirarMl: number;
  diluenteAdicionarMl?: number;
};

function toNumber(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function formatPtBr(value: number) {
  // Eu padronizo a exibição em PT-BR para evitar ruído visual entre ponto e vírgula.
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function DiluicaoPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [accessPlan, setAccessPlan] = useState<AccessPlan | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage | null>(null);
  const [result, setResult] = useState<DiluicaoResult | null>(null);
  const [uiMessage, setUiMessage] = useState<string | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const [frascoMg, setFrascoMg] = useState("");
  const [diluenteMl, setDiluenteMl] = useState("");
  const [dosePrescritaMg, setDosePrescritaMg] = useState("");
  const [volumeFinalMl, setVolumeFinalMl] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        try {
          setUid(user.uid);
          setLoadingUsage(true);

          // Eu carrego acesso e uso diario no login para aplicar bloqueio e limite antes do calculo.
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
    const frasco = toNumber(frascoMg);
    const diluente = toNumber(diluenteMl);
    const dose = toNumber(dosePrescritaMg);
    const volumeFinal = volumeFinalMl ? toNumber(volumeFinalMl) : null;

    if (!frascoMg || !diluenteMl || !dosePrescritaMg) {
      return { ok: false as const, message: "Preencha os campos obrigatorios." };
    }

    if ([frasco, diluente, dose].some((value) => Number.isNaN(value))) {
      return { ok: false as const, message: "Use apenas numeros validos." };
    }

    if (frasco <= 0 || diluente <= 0 || dose <= 0) {
      return { ok: false as const, message: "Os valores precisam ser maiores que zero." };
    }

    if (volumeFinalMl) {
      if (volumeFinal === null || Number.isNaN(volumeFinal)) {
        return { ok: false as const, message: "Use apenas numeros validos no volume final." };
      }
      if (volumeFinal <= 0) {
        return { ok: false as const, message: "O volume final precisa ser maior que zero." };
      }
    }

    return {
      ok: true as const,
      frasco,
      diluente,
      dose,
      volumeFinal,
    };
  }, [frascoMg, diluenteMl, dosePrescritaMg, volumeFinalMl]);

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

      // Eu consumo o uso diario no clique do calcular para manter a regra igual das outras calculadoras.
      const transactionResult = await incrementDailyUsage(uid, "calculadora", accessPlan);
      setDailyUsage(transactionResult.usage);

      if (transactionResult.status !== "incremented") {
        setResult(null);
        setUiMessage("Voce atingiu o limite diario da Calculadora no Plano Free.");
        return;
      }

      const concentracaoMgMl = formState.frasco / formState.diluente;
      const volumeAspirarMl = formState.dose / concentracaoMgMl;

      if (formState.volumeFinal !== null) {
        const diluenteAdicionarMl = formState.volumeFinal - volumeAspirarMl;
        if (diluenteAdicionarMl < 0) {
          setResult(null);
          setUiMessage("O volume final nao pode ser menor que o volume a aspirar.");
          return;
        }

        setResult({
          concentracaoMgMl,
          volumeAspirarMl,
          diluenteAdicionarMl,
        });
      } else {
        setResult({
          concentracaoMgMl,
          volumeAspirarMl,
        });
      }

      setUiMessage(null);
    } catch {
      setUiMessage("Erro ao registrar o uso diario. Tente novamente.");
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
      await addDoc(collection(db, "calculos"), {
        uid,
        tipo: "diluicao_reconstituicao",
        frascoMg,
        diluenteMl,
        dosePrescritaMg,
        ...(volumeFinalMl ? { volumeFinalMl } : {}),
        concentracaoMgMl: Number(result.concentracaoMgMl.toFixed(4)),
        volumeAspirarMl: Number(result.volumeAspirarMl.toFixed(4)),
        ...(typeof result.diluenteAdicionarMl === "number"
          ? { diluenteAdicionarMl: Number(result.diluenteAdicionarMl.toFixed(4)) }
          : {}),
        createdAt: serverTimestamp(),
      });

      setUiMessage("Calculo salvo no historico.");
    } catch {
      setUiMessage("Erro ao salvar no historico. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
        <h1 className="text-2xl font-bold">Diluicao / Reconstituicao</h1>
        <p className="text-sm text-zinc-300">
          Calcule concentracao final e volume a aspirar a partir do frasco e diluente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Dose total do frasco (mg)</label>
            <input
              className="w-full border border-zinc-700 bg-zinc-950 rounded p-2"
              placeholder="Ex: 1000"
              value={frascoMg}
              onChange={(e) => setFrascoMg(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Volume do diluente adicionado (mL)</label>
            <input
              className="w-full border border-zinc-700 bg-zinc-950 rounded p-2"
              placeholder="Ex: 10"
              value={diluenteMl}
              onChange={(e) => setDiluenteMl(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Dose prescrita (mg)</label>
            <input
              className="w-full border border-zinc-700 bg-zinc-950 rounded p-2"
              placeholder="Ex: 250"
              value={dosePrescritaMg}
              onChange={(e) => setDosePrescritaMg(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Volume final desejado (mL) (opcional)</label>
            <input
              className="w-full border border-zinc-700 bg-zinc-950 rounded p-2"
              placeholder="Ex: 5"
              value={volumeFinalMl}
              onChange={(e) => setVolumeFinalMl(e.target.value)}
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
            <div className="space-y-2">
              <p>
                <span className="text-zinc-300">Concentracao final:</span>{" "}
                <strong>{formatPtBr(result.concentracaoMgMl)} mg/mL</strong>
              </p>
              <p>
                <span className="text-zinc-300">Volume a aspirar:</span>{" "}
                <strong>{formatPtBr(result.volumeAspirarMl)} mL</strong>
              </p>
              {typeof result.diluenteAdicionarMl === "number" && (
                <p>
                  <span className="text-zinc-300">Adicionar diluente:</span>{" "}
                  <strong>{formatPtBr(result.diluenteAdicionarMl)} mL</strong>{" "}
                  <span className="text-zinc-400">
                    (para completar para {volumeFinalMl} mL)
                  </span>
                </p>
              )}
              <p className="text-xs text-zinc-400">
                * Ferramenta de apoio ao estudo. Conferir sempre com protocolo/posologia.
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-300">Preencha os campos e clique em Calcular.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/calculadoras")}
            className="flex-1 min-w-[130px] rounded p-2 bg-black text-white"
          >
            Voltar
          </button>

          <button
            onClick={() => {
              // Eu limpo os campos e resultados para recomeçar um novo calculo do zero.
              setFrascoMg("");
              setDiluenteMl("");
              setDosePrescritaMg("");
              setVolumeFinalMl("");
              setResult(null);
              setUiMessage(null);
            }}
            className="flex-1 min-w-[130px] rounded p-2 border border-zinc-700"
          >
            Limpar
          </button>

          <button
            onClick={handleCalculate}
            disabled={loadingUsage || isCalculating || !canUseFeature || isLimitReached}
            className="flex-1 min-w-[130px] rounded p-2 bg-blue-600 text-white disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {isLimitReached ? "Limite atingido" : isCalculating ? "Calculando..." : "Calcular"}
          </button>

          <button
            onClick={handleSave}
            disabled={!result}
            className="flex-1 min-w-[130px] rounded p-2 bg-emerald-600 text-white disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
