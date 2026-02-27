"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "../../lib/firebase";
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

  const [doseMg, setDoseMg] = useState("");
  const [concMg, setConcMg] = useState("");
  const [volMl, setVolMl] = useState("");

  // Protege rota + pega UID
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUid(user.uid);
      }
    });

    return () => unsub();
  }, [router]);

  const result = useMemo(() => {
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

    const ml = (dose * vol) / conc;
    return { ok: true as const, ml };
  }, [doseMg, concMg, volMl]);

  const handleSave = async () => {
    if (!uid) return alert("Você precisa estar logada.");
    if (!result.ok) return alert("Preencha os campos corretamente antes de salvar.");

    try {
      await addDoc(collection(db, "calculos"), {
        uid,
        tipo: "regra_de_tres_mg_ml",
        doseMg,
        concMg,
        volMl,
        resultadoMl: Number(result.ml.toFixed(4)),
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

        <div className="rounded-lg border p-4">
          {!result.ok ? (
            <p className="text-sm text-gray-700">{result.message}</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Volume a administrar:</p>
              <p className="text-3xl font-bold">{result.ml.toFixed(2)} mL</p>
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
            }}
          >
            Limpar
          </button>

          <button
            className="flex-1 bg-blue-600 text-white rounded p-2"
            onClick={handleSave}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}