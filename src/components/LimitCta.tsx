import Link from "next/link";

type LimitCtaProps = {
  isPro: boolean;
  canUseFeature: boolean;
  count: number;
  limit: number;
  isLimitReached: boolean;
  uiMessage: string | null;
};

export function LimitCta({
  isPro,
  canUseFeature,
  count,
  limit,
  isLimitReached,
  uiMessage,
}: LimitCtaProps) {
  return (
    <div className="space-y-2">
      {!canUseFeature ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">Acesso inativo ou não encontrado.</p>
        </div>
      ) : isPro ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-700">Plano Pro ativo: uso ilimitado.</p>
        </div>
      ) : isLimitReached ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
          <p className="text-sm font-semibold text-amber-800">⚠️ Limite diário atingido</p>
          <p className="text-sm text-amber-800">
            Você chegou a {limit}/{limit} usos hoje no Plano Free. Para continuar sem limite,
            assine o Plano Pro.
          </p>
          <Link
            href="/upgrade"
            className="inline-flex rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Ver Plano Pro
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm text-gray-700">
            Plano Free: {count}/{limit} usos hoje
          </p>
        </div>
      )}

      {uiMessage && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            uiMessage.startsWith("Erro")
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-gray-200 bg-gray-50 text-gray-700"
          }`}
        >
          {uiMessage}
        </div>
      )}
    </div>
  );
}
