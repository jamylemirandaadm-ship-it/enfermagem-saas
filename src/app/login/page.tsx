"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Usuário criado com sucesso!");
    } catch (error: any) {
      alert(error.message);
    }
  };

 const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login realizado!");
    router.push("/dashboard"); // redireciona após login
  } catch (error: any) {
    alert(error.message);
  }
};

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Login Enfermagem Pro</h1>
      
      <input
        type="email"
        placeholder="Email"
        className="border p-2"
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <input
        type="password"
        placeholder="Senha"
        className="border p-2"
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <button onClick={handleRegister} className="bg-blue-500 text-white px-4 py-2">
        Criar Conta
      </button>
      
      <button onClick={handleLogin} className="bg-green-500 text-white px-4 py-2">
        Entrar
      </button>
    </div>
  );
}