"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";

type CalcItem = {
  id: string;
  tipo: string;

  // Regra de 3
  doseMg?: string;
  concMg?: string;
  volMl?: string;
  resultadoMl?: number;

  // Gotejamento
  volumeMl?: string;
  tempoMin?: string;
  mlHora?: number;
  gotasMin?: number;
  microgotasMin?: number;
};

export default function HistoricoPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<CalcItem[]>([]);

  // Protege rota + pega UID
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUid(user.uid);
      }
    });

    return () => unsubAuth();
  }, [router]);

  // Assina a lista do Firestore (tempo real)
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "calculos"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(data);
    });

    return () => unsub();
  }, [uid]);

  const handleDelete = async (id: string) => {
    const ok = confirm("Deseja excluir este item do histórico?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "calculos", id));
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  const getTitle = (it: CalcItem) => {
    if (it.tipo === "regra_de_tres_mg_ml") return "Regra de 3 (mg → mL)";
    if (it.tipo === "gotejamento") return "Gotejamento";
    return it.tipo;
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Histórico</h1>

        <button
          className="border rounded px-3 py-2"
          onClick={() => router.push("/dashboard")}
        >
          Voltar
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-600">
          Ainda não tem cálculos salvos. Vá em <b>/calculadora</b> ou{" "}
          <b>/gotejamento</b> e clique em <b>Salvar</b>.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="border rounded-lg p-4">
              {/* Cabeçalho do card */}
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{getTitle(it)}</p>

                <button
                  className="text-sm border rounded px-2 py-1 text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(it.id)}
                >
                  Excluir
                </button>
              </div>

              {/* Conteúdo do card */}
              {it.tipo === "regra_de_tres_mg_ml" ? (
                <>
                  <p className="text-sm text-gray-700 mt-2">
                    Dose: {it.doseMg ?? "--"} mg | Concentração: {it.concMg ?? "--"}{" "}
                    mg | Volume: {it.volMl ?? "--"} mL
                  </p>

                  <p className="text-lg font-bold mt-2">
                    Resultado:{" "}
                    {typeof it.resultadoMl === "number"
                      ? it.resultadoMl.toFixed(2)
                      : "--"}{" "}
                    mL
                  </p>
                </>
              ) : it.tipo === "gotejamento" ? (
                <>
                  <p className="text-sm text-gray-700 mt-2">
                    Volume: {it.volumeMl ?? "--"} mL | Tempo: {it.tempoMin ?? "--"}{" "}
                    min
                  </p>

                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <strong>mL/h:</strong>{" "}
                      {typeof it.mlHora === "number" ? it.mlHora.toFixed(2) : "--"}
                    </p>
                    <p className="text-sm">
                      <strong>Gotas/min (20):</strong>{" "}
                      {typeof it.gotasMin === "number"
                        ? it.gotasMin.toFixed(0)
                        : "--"}
                    </p>
                    <p className="text-sm">
                      <strong>Microgotas/min (60):</strong>{" "}
                      {typeof it.microgotasMin === "number"
                        ? it.microgotasMin.toFixed(0)
                        : "--"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600 mt-2">
                  Tipo ainda não formatado no histórico.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}