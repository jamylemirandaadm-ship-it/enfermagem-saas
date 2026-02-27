"use client";

import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setUserEmail(user.email);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <h1 className="text-3xl font-bold">Enfermagem Pro</h1>

      {userEmail && <p className="text-gray-600 text-sm">Logada como: {userEmail}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <button
          onClick={() => router.push("/calculadora")}
          className="border rounded-xl p-4 text-left hover:bg-gray-50"
        >
          <p className="font-medium">🧮 Calculadora de Medicação</p>
          <p className="text-sm text-gray-600">Regra de 3 (mg → mL)</p>
        </button>

        <button
          onClick={() => router.push("/gotejamento")}
          className="border rounded-xl p-4 text-left hover:bg-gray-50"
        >
          <p className="font-medium">💧 Gotejamento</p>
          <p className="text-sm text-gray-600">mL/h, gotas/min, microgotas</p>
        </button>

        <button
          onClick={() => router.push("/historico")}
          className="border rounded-xl p-4 text-left hover:bg-gray-50 sm:col-span-2"
        >
          <p className="font-medium">📜 Histórico</p>
          <p className="text-sm text-gray-600">Ver cálculos salvos</p>
        </button>
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Sair
      </button>
    </div>
  );
}