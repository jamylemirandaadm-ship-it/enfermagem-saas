"use client"; 
// Diz ao Next.js que este componente roda no CLIENT (usa hooks, auth, router)

import { useEffect, useState } from "react";
// useState → guardar estado (email)
// useEffect → rodar código quando o componente carrega

import { auth } from "@/lib/firebase";
// Importa o Firebase Auth configurado por mim
import { ensureFreeAccess } from "@/lib/ensure-access";

import { onAuthStateChanged, signOut } from "firebase/auth";
// onAuthStateChanged → escuta se o usuário está logado
// signOut → função para deslogar

import { useRouter } from "next/navigation";
// useRouter → navegar entre páginas (/login, /calculadora, etc)

export default function Dashboard() {
  const router = useRouter();

  // Guarda o email do usuário logado
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  // 🔐 Proteção de rota
  // Esse efeito roda quando o dashboard carrega
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Se NÃO estiver logado → manda para o login
        router.push("/login");
      } else {
        try {
          setAccessError(null);

          // Eu garanto o plano Free aqui no primeiro ponto apos o login para as outras telas ja lerem acessos/{uid}.
          await ensureFreeAccess(user.uid);

          // Se estiver logado → salva o email para mostrar na tela
          setUserEmail(user.email);
        } catch (e: any) {
          // Eu mostro uma mensagem amigavel na tela porque sem esse acesso as features podem ficar bloqueadas.
          setAccessError("Nao consegui preparar seu acesso agora. Tente recarregar a pagina em alguns segundos.");
        }
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

      {accessError && (
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {accessError}
        </div>
      )}

      {/* GRID DE FUNCIONALIDADES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        {/* Eu crio um hub central para concentrar as calculadoras atuais e futuras. */}
        <button
          onClick={() => router.push("/calculadoras")}
          className="border rounded-xl p-4 text-left hover:bg-gray-50 sm:col-span-2"
        >
          <p className="font-medium">🧮 Calculadoras</p>
          <p className="text-sm text-gray-600">
            Acesse todas as calculadoras em um só lugar
          </p>
        </button>

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
        {/* Eu deixo um atalho claro para a usuaria conhecer o plano pago. */}
        <button
          onClick={() => router.push("/upgrade")}
          className="border border-emerald-300 rounded-xl p-4 text-left hover:bg-emerald-50 sm:col-span-2"
        >
          <p className="font-medium">✨ Ver Plano Pro</p>
          <p className="text-sm text-gray-600">
            Compare Free vs Pro e veja como ativar
          </p>
        </button>

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
