import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export async function ensureFreeAccess(uid: string): Promise<void> {
  // Eu leio primeiro para garantir que nunca vou sobrescrever um acesso que ja existe.
  const accessRef = doc(db, "acessos", uid);
  const accessSnap = await getDoc(accessRef);

  if (accessSnap.exists()) {
    return;
  }

  // Eu crio o plano Free padrao so quando esse usuario ainda nao tem documento em acessos.
  await setDoc(accessRef, {
    plan: "free",
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
