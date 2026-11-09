import { useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePwaInstall } from "@/hooks/use-pwa-install";

interface InstallAppButtonProps {
  variant?: "header" | "inline";
  className?: string;
}

export function InstallAppButton({ variant = "header", className }: InstallAppButtonProps) {
  const { available, needsManualSteps, install } = usePwaInstall();
  const [showSteps, setShowSteps] = useState(false);

  if (!available) return null;

  const handleClick = () => (needsManualSteps ? setShowSteps(true) : void install());

  return (
    <>
      {variant === "header" ? (
        <button
          onClick={handleClick}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-[#BFE3C8] bg-[#E6F4EA] px-2.5 py-1.5 text-xs font-semibold text-[#1A7A44] transition-colors hover:bg-[#BFE3C8]/60",
            className
          )}
          aria-label="Instalar o aplicativo"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Instalar app</span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 text-sm font-medium text-[#1A7A44] hover:underline",
            className
          )}
        >
          <Download className="h-4 w-4" />
          Instalar o aplicativo no seu aparelho
        </button>
      )}

      {showSteps && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setShowSteps(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-steps-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h2 id="install-steps-title" className="text-base font-bold text-[#123A24]">
                Instalar no iPhone ou iPad
              </h2>
              <button
                onClick={() => setShowSteps(false)}
                className="rounded-lg p-1 text-[#5B7264] hover:bg-[#F4FAF5]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-[#123A24]">
              <li className="flex items-start gap-3">
                <Share className="mt-0.5 h-5 w-5 shrink-0 text-[#1A7A44]" />
                <span>
                  No Safari, toque em <b>Compartilhar</b>, na barra de baixo da tela.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <SquarePlus className="mt-0.5 h-5 w-5 shrink-0 text-[#1A7A44]" />
                <span>
                  Escolha <b>Adicionar à Tela de Início</b> e confirme em <b>Adicionar</b>.
                </span>
              </li>
            </ol>
            <p className="mt-4 text-xs text-[#5B7264]">
              O ícone do Caminho do Vale aparece na tela inicial e abre como um aplicativo.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
