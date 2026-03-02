"use client"; 
// Diz ao Next.js que este componente roda no CLIENT (usa hooks, auth, router)

import { useEffect, useState } from "react";
// useState → guardar estado (email)
// useEffect → rodar código quando o componente carrega

import { auth } from "../../lib/firebase";
// Importa o Firebase Auth configurado por mim

import { onAuthStateChanged, signOut } from "firebase/auth";
// onAuthStateChanged → escuta se o usuário está logado
// signOut → função para deslogar

import { useRouter } from "next/navigation";
// useRouter → navegar entre páginas (/login, /calculadora, etc)

export default function Dashboard() {
  const router = useRouter();

  // Guarda o email do usuário logado
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 🔐 Proteção de rota
  // Esse efeito roda quando o dashboard carrega
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Se NÃO estiver logado → manda para o login
        router.push("/login");
      } else {
        // Se estiver logado → salva o email para mostrar na tela
        setUserEmail(user.email);
      }
    });

    // Remove o listener quando sair da página (boa prática)
    return () => unsubscribe();
  }, [router]);

  // 🚪 Função de logout
  const handleLogout = async () => {
    await signOut(auth); // desloga no Firebase
    router.push("/login"); // volta para a tela de login
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      {/* Título do app */}
      <h1 className="text-3xl font-bold">Enfermagem Pro</h1>

      {/* Mostra o email da usuária logada */}
      {userEmail && (
        <p className="text-gray-600 text-sm">
          Logada como: {userEmail}
        </p>
      )}

      {/* GRID DE FUNCIONALIDADES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">

        {/* 🧮 Calculadora de Medicação */}
        <button
          onClick={() => router.push("/calculadora")}
          className="border rounded-xl p-4 text-left hover:bg-gray-50"
        >
          <p className="font-medium">🧮 Calculadora de Medicação</p>
          <p className="text-sm text-gray-600">
            Regra de 3 (mg → mL)
          </p>
        </button>

        {/* 💧 Gotejamento */}
        <button
          onClick={() => router.push("/gotejamento")}
          className="border rounded-xl p-4 text-left hover:bg-gray-50"
        >
          <p className="font-medium">💧 Gotejamento</p>
          <p className="text-sm text-gray-600">
            mL/h, gotas/min, microgotas
          </p>
        </button>

        {/* 📘 Abreviações / Terminologia */}
        <button
          onClick={() => router.push("/abreviacoes")}
          className="border rounded-xl p-4 text-left hover:bg-gray-50 sm:col-span-2"
        >
          <p className="font-medium">📘 Abreviações & Terminologia</p>
          <p className="text-sm text-gray-600">
            Busca rápida e copiar termos
          </p>
        </button>

        {/* 📜 Histórico */}
        <button
          onClick={() => router.push("/historico")}
          className="border rounded-xl p-4 text-left hover:bg-gray-50 sm:col-span-2"
        >
          <p className="font-medium">📜 Histórico</p>
          <p className="text-sm text-gray-600">
            Ver cálculos salvos
          </p>
        </button>

        {/* 🔮 FUTURAS FUNCIONALIDADES (comentadas)
            Irei ativar quando criar as páginas
        */}
        {/*
        <button
          onClick={() => router.push("/simulado")}
          className="border rounded-xl p-4 text-left hover:bg-gray-50 sm:col-span-2"
        >
          <p className="font-medium">📝 Simulado</p>
          <p className="text-sm text-gray-600">
            Questões para treino e provas
          </p>
        </button>
        */}

      </div>

      {/* Botão de sair */}
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Sair
      </button>
    </div>
  );
}