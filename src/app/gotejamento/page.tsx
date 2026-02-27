"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function Gotejamento() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);

  const [volume, setVolume] = useState("");
  const [tempo, setTempo] = useState("");

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
    const vol = Number(volume);
    const t = Number(tempo);

    if (!volume || !tempo) return null;
    if (!Number.isFinite(vol) || !Number.isFinite(t)) return null;
    if (vol <= 0 || t <= 0) return null;

    const mlHora = vol / (t / 60);
    const gotasMin = (vol * 20) / t;
    const microgotasMin = (vol * 60) / t;

    return { mlHora, gotasMin, microgotasMin };
  }, [volume, tempo]);

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

        {result && (
          <div className="border rounded p-4 space-y-2">
            <p>
              <strong>mL/h:</strong> {result.mlHora.toFixed(2)}
            </p>
            <p>
              <strong>Gotas/min (20):</strong> {result.gotasMin.toFixed(0)}
            </p>
            <p>
              <strong>Microgotas/min (60):</strong> {result.microgotasMin.toFixed(0)}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="flex-1 bg-black text-white rounded p-2"
            onClick={() => router.push("/dashboard")}
          >
            Voltar
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