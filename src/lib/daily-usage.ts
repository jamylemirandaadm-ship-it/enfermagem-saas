import { db } from "@/lib/firebase";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";

export const FREE_DAILY_LIMIT = 5;

export type FeatureKey = "calculadora" | "gotejamento";

export type AccessPlan = {
  exists: boolean;
  plan: string | null;
  isActive: boolean;
  isPro: boolean;
};

export type DailyUsage = {
  docId: string;
  dateKey: string;
  calculadoraCount: number;
  gotejamentoCount: number;
};

export type IncrementUsageResult =
  | {
      status: "incremented";
      usage: DailyUsage;
    }
  | {
      status: "limit_reached";
      usage: DailyUsage;
    };

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getTodayKey() {
  // Eu uso a data local do navegador para evitar erro de UTC virando o dia antes da hora no Brasil.
  const now = new Date();
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());

  return `${year}-${month}-${day}`;
}

function getUsageDocId(uid: string, dateKey: string) {
  // Eu monto um id previsivel para encontrar sempre o documento daquele usuario naquele dia.
  return `${uid}_${dateKey}`;
}

function normalizeCount(value: unknown) {
  // Eu trato campo ausente ou invalido como zero para manter a transacao resiliente.
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function getUserAccess(uid: string): Promise<AccessPlan> {
  // Eu leio o documento de acesso para decidir se a usuaria pode usar o app e se ela tem Pro.
  const accessRef = doc(db, "acessos", uid);
  const accessSnap = await getDoc(accessRef);

  if (!accessSnap.exists()) {
    return {
      exists: false,
      plan: null,
      isActive: false,
      isPro: false,
    };
  }

  const data = accessSnap.data();
  const plan = typeof data.plan === "string" ? data.plan : null;
  const isActive = Boolean(data.isActive);
  const isPro = plan === "pro" && isActive;

  return {
    exists: true,
    plan,
    isActive,
    isPro,
  };
}

export function canUseApp(access: AccessPlan | null) {
  // Eu bloqueio o uso quando o acesso nao existe ou esta inativo.
  return Boolean(access?.exists && access.isActive);
}

export async function getDailyUsage(uid: string): Promise<DailyUsage> {
  // Eu carrego o uso do dia para mostrar o contador atual e decidir o estado do botao.
  const dateKey = getTodayKey();
  const docId = getUsageDocId(uid, dateKey);
  const usageRef = doc(db, "uso_diario", docId);
  const usageSnap = await getDoc(usageRef);

  if (!usageSnap.exists()) {
    return {
      docId,
      dateKey,
      calculadoraCount: 0,
      gotejamentoCount: 0,
    };
  }

  const data = usageSnap.data();

  return {
    docId,
    dateKey,
    calculadoraCount: normalizeCount(data.calculadoraCount),
    gotejamentoCount: normalizeCount(data.gotejamentoCount),
  };
}

export function getFeatureCount(usage: DailyUsage, feature: FeatureKey) {
  // Eu encapsulo a leitura do contador por feature para nao repetir condicionais nas paginas.
  return feature === "calculadora"
    ? usage.calculadoraCount
    : usage.gotejamentoCount;
}

export function hasReachedLimit(
  access: AccessPlan | null,
  usage: DailyUsage | null,
  feature: FeatureKey
) {
  // Eu so aplico limite para usuaria Free ativa; Pro ativa continua ilimitado.
  if (!canUseApp(access)) return true;
  if (access?.isPro) return false;
  if (!usage) return false;

  return getFeatureCount(usage, feature) >= FREE_DAILY_LIMIT;
}

export async function incrementDailyUsage(
  uid: string,
  feature: FeatureKey,
  access: AccessPlan
): Promise<IncrementUsageResult> {
  const dateKey = getTodayKey();
  const docId = getUsageDocId(uid, dateKey);
  const usageRef = doc(db, "uso_diario", docId);

  const result = await runTransaction(db, async (transaction) => {
    const usageSnap = await transaction.get(usageRef);
    const currentData = usageSnap.exists() ? usageSnap.data() : {};

    const currentCalculadora = normalizeCount(currentData.calculadoraCount);
    const currentGotejamento = normalizeCount(currentData.gotejamentoCount);

    const currentFeatureCount =
      feature === "calculadora" ? currentCalculadora : currentGotejamento;

    if (!access.isPro && currentFeatureCount >= FREE_DAILY_LIMIT) {
      // Eu corto aqui dentro da transacao para impedir que cliques rapidos ultrapassem o limite Free.
      return {
        status: "limit_reached" as const,
        usage: {
          docId,
          dateKey,
          calculadoraCount: currentCalculadora,
          gotejamentoCount: currentGotejamento,
        },
      };
    }

    const nextCalculadora =
      feature === "calculadora" ? currentCalculadora + 1 : currentCalculadora;

    const nextGotejamento =
      feature === "gotejamento" ? currentGotejamento + 1 : currentGotejamento;

    // Eu escrevo os dois contadores explicitamente para criar o doc se faltar e preservar o outro contador.
    transaction.set(
      usageRef,
      {
        uid,
        date: dateKey,
        calculadoraCount: nextCalculadora,
        gotejamentoCount: nextGotejamento,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      status: "incremented" as const,
      usage: {
        docId,
        dateKey,
        calculadoraCount: nextCalculadora,
        gotejamentoCount: nextGotejamento,
      },
    };
  });

  return result;
}
