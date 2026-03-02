"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type Item = {
  abrev: string;
  termo: string;
  categoria: string;
  obs?: string;
};

const DATA: Item[] = [
  // Administração / Dose
  { abrev: "VO", termo: "Via oral", categoria: "Vias de administração" },
  { abrev: "EV / IV", termo: "Endovenosa (intravenosa)", categoria: "Vias de administração" },
  { abrev: "IM", termo: "Intramuscular", categoria: "Vias de administração" },
  { abrev: "SC / SQ", termo: "Subcutânea", categoria: "Vias de administração" },
  { abrev: "ID", termo: "Intradérmica", categoria: "Vias de administração" },
  { abrev: "SL", termo: "Sublingual", categoria: "Vias de administração" },
  { abrev: "NEB", termo: "Nebulização", categoria: "Vias de administração" },
  { abrev: "SNE", termo: "Sonda nasoenteral", categoria: "Dispositivos/Sondas" },
  { abrev: "SNG", termo: "Sonda nasogástrica", categoria: "Dispositivos/Sondas" },
  { abrev: "SV", termo: "Sonda vesical", categoria: "Dispositivos/Sondas" },

  // Rotina / Prescrição
  { abrev: "SOS", termo: "Se necessário", categoria: "Prescrição/Rotina" },
  { abrev: "ACM", termo: "A critério médico", categoria: "Prescrição/Rotina" },
  { abrev: "NPO / JEJUM", termo: "Nada por via oral (jejum)", categoria: "Prescrição/Rotina" },
  { abrev: "Dieta VO", termo: "Dieta por via oral", categoria: "Prescrição/Rotina" },
  { abrev: "ATB", termo: "Antibiótico", categoria: "Prescrição/Rotina" },
  { abrev: "S/N", termo: "Sem novidades", categoria: "Anotações" },
  { abrev: "Evol.", termo: "Evolução", categoria: "Anotações" },

  // Sinais vitais / Medidas
  { abrev: "PA", termo: "Pressão arterial", categoria: "Sinais vitais" },
  { abrev: "FC", termo: "Frequência cardíaca", categoria: "Sinais vitais" },
  { abrev: "FR", termo: "Frequência respiratória", categoria: "Sinais vitais" },
  { abrev: "SpO₂", termo: "Saturação periférica de oxigênio", categoria: "Sinais vitais" },
  { abrev: "T", termo: "Temperatura", categoria: "Sinais vitais" },
  { abrev: "HGT", termo: "Hemoglicoteste (glicemia capilar)", categoria: "Sinais vitais" },

  // Procedimentos / Equipamentos
  { abrev: "O₂", termo: "Oxigênio", categoria: "Procedimentos/Equipamentos" },
  { abrev: "CPAP", termo: "Pressão positiva contínua nas vias aéreas", categoria: "Procedimentos/Equipamentos" },
  { abrev: "BIPAP", termo: "Pressão positiva em dois níveis", categoria: "Procedimentos/Equipamentos" },
  { abrev: "SVD", termo: "Sonda vesical de demora", categoria: "Dispositivos/Sondas" },
  { abrev: "AVP", termo: "Acesso venoso periférico", categoria: "Procedimentos/Equipamentos" },

  // Tempo / Frequência
  { abrev: "12/12h", termo: "A cada 12 horas", categoria: "Frequência/Tempo" },
  { abrev: "8/8h", termo: "A cada 8 horas", categoria: "Frequência/Tempo" },
  { abrev: "6/6h", termo: "A cada 6 horas", categoria: "Frequência/Tempo" },
  { abrev: "2/2h", termo: "A cada 2 horas", categoria: "Frequência/Tempo" },

  // Alguns comuns
  { abrev: "AA", termo: "Ar ambiente", categoria: "Clínico" },
  { abrev: "MMSS", termo: "Membros superiores", categoria: "Clínico" },
  { abrev: "MMII", termo: "Membros inferiores", categoria: "Clínico" },
];

const FAVORITES_KEY = "enf_favorites_abrevs_v1";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default function AbreviacoesPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Protege rota
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

  // Carregar favoritos (local)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);

  // Persistir favoritos (local)
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const categories = useMemo(() => {
    const set = new Set(DATA.map((d) => d.categoria));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, []);

  const filtered = useMemo(() => {
    const nq = normalize(q.trim());
    return DATA.filter((it) => {
      const inCat = cat === "Todas" ? true : it.categoria === cat;
      if (!inCat) return false;
      if (!nq) return true;

      const hay = normalize(`${it.abrev} ${it.termo} ${it.categoria} ${it.obs ?? ""}`);
      return hay.includes(nq);
    });
  }, [q, cat]);

  const onlyFavs = useMemo(() => {
    return filtered.filter((it) => favorites[it.abrev]);
  }, [filtered, favorites]);

  const [showFavs, setShowFavs] = useState(false);

  const list = showFavs ? onlyFavs : filtered;

  const toggleFav = (abrev: string) => {
    setFavorites((prev) => ({ ...prev, [abrev]: !prev[abrev] }));
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiado ✅");
    } catch {
      alert("Não consegui copiar automaticamente. Selecione e copie.");
    }
  };

  if (!uid) {
    // evita piscar conteúdo antes da checagem do auth
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Abreviações e Terminologia</h1>
          <p className="text-sm text-gray-600">
            Busca rápida + copiar. (Conteúdo de apoio ao estudo.)
          </p>
        </div>

        <button
          className="border rounded px-3 py-2"
          onClick={() => router.push("/dashboard")}
        >
          Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          className="border rounded p-2 sm:col-span-2"
          placeholder="Buscar: ex. VO, HGT, sonda, pressão..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="border rounded p-2"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="border rounded px-3 py-2"
          onClick={() => setShowFavs((v) => !v)}
        >
          {showFavs ? "Ver tudo" : "Ver favoritos"}
        </button>

        <p className="text-sm text-gray-600">
          {list.length} item(ns)
        </p>
      </div>

      <div className="space-y-3">
        {list.map((it) => (
          <div key={it.abrev} className="border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{it.abrev}</p>
                <p className="text-gray-700">{it.termo}</p>
                <p className="text-xs text-gray-500 mt-1">{it.categoria}</p>
                {it.obs && <p className="text-xs text-gray-500 mt-1">{it.obs}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  className="border rounded px-3 py-2 text-sm"
                  onClick={() => copyText(`${it.abrev} — ${it.termo}`)}
                >
                  Copiar
                </button>

                <button
                  className="border rounded px-3 py-2 text-sm"
                  onClick={() => toggleFav(it.abrev)}
                  title="Favoritar"
                >
                  {favorites[it.abrev] ? "★ Favorito" : "☆ Favoritar"}
                </button>
              </div>
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <p className="text-gray-600">Nada encontrado. Tente outro termo.</p>
        )}
      </div>
    </div>
  );
}