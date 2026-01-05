import { Shield, Activity, GitCommit, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-zinc-800/50 bg-zinc-950/50 py-6 px-8 backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto font-mono">
        <div className="flex items-center gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            <span>
              {t("footer.system")}: <span className="text-zinc-300">{t("footer.healthy")}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GitCommit className="w-3.5 h-3.5 text-accent" />
            <span>
              {t("footer.version")}: <span className="text-zinc-300">v1.2.4-stable</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>
              {t("footer.environment")}: <span className="text-zinc-300 uppercase">Production</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-zinc-600 uppercase tracking-widest">
          <span>&copy; {currentYear} DeployZilla</span>
          <span className="hidden md:inline">|</span>
          <div className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default group">
            {t("footer.built_with")} <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500 group-hover:scale-125 transition-transform" />{" "}
            {t("footer.for_teams")}
          </div>
        </div>
      </div>
    </footer>
  );
};
