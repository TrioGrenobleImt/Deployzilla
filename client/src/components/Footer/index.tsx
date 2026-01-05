import { Shield, Activity, GitCommit, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/50 bg-background/80 py-8 px-8 backdrop-blur-xl relative z-10 transition-colors duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-green-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {t("footer.system")}: <span className="text-green-500 font-black tracking-normal">Online</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-accent/10 rounded-lg group-hover:scale-110 transition-transform">
              <GitCommit className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {t("footer.version")}: <span className="text-accent font-black tracking-normal">v1.2.4</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {t("footer.environment")}: <span className="text-blue-500 font-black tracking-normal">Production</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 text-[10px] text-muted-foreground/60 font-medium uppercase tracking-[0.3em]">
          <span className="text-[9px] font-black tracking-tighter opacity-80">&copy; {currentYear} DeployZilla Architecture</span>
          <span className="hidden md:inline text-border">|</span>
          <div className="flex items-center gap-2 grayscale brightness-125 dark:brightness-100 dark:grayscale-0 opacity-40 hover:grayscale-0 hover:opacity-100 hover:brightness-100 transition-all cursor-default group py-1 px-3 bg-muted/30 rounded-full border border-transparent hover:border-border/50">
            {t("footer.built_with")} <Heart className="w-3 h-3 text-red-500 fill-red-500 group-hover:scale-125 transition-transform" />{" "}
            {t("footer.for_teams")}
          </div>
        </div>
      </div>
    </footer>
  );
};
