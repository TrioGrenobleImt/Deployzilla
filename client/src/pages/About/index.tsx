import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Github, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const About = () => {
  const { t } = useTranslation();

  const developers = [{ id: "dev1" }, { id: "dev2" }, { id: "dev3" }, { id: "dev4" }];

  return (
    <div className="container mx-auto p-6 lg:p-10 space-y-8 animate-in fade-in duration-500 flex flex-col justify-center min-h-[80vh]">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">{t("pages.about.title")}</h1>
        <p className="text-muted-foreground text-lg">{t("pages.about.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {developers.map((dev) => {
          const skills = t(`pages.about.developers.${dev.id}.skills`, { returnObjects: true }) as string[];
          const stats = t(`pages.about.developers.${dev.id}.stats`, { returnObjects: true }) as Record<string, string>;

          return (
            <Card
              key={dev.id}
              className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-sm transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <CardHeader className="flex flex-col items-center pb-4 relative z-10">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl mb-4 group-hover:scale-105 transition-transform">
                  <AvatarImage src={t(`pages.about.developers.${dev.id}.image`)} alt={t(`pages.about.developers.${dev.id}.name`)} />
                  <AvatarFallback>{t(`pages.about.developers.${dev.id}.name`).substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl font-bold tracking-tight text-center">{t(`pages.about.developers.${dev.id}.name`)}</CardTitle>
                <CardDescription className="font-mono text-xs text-center text-accent font-bold uppercase tracking-widest">
                  {t(`pages.about.developers.${dev.id}.role`)}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center gap-6 relative z-10 p-6 pt-0">
                <div className="grid grid-cols-3 gap-4 w-full border-y border-border/50 py-4 my-2">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                      {stats.commits}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t("pages.about.stats_labels.commits")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-1 border-x border-border/50">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                      {stats.projects}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t("pages.about.stats_labels.projects")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                      {stats.experience}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t("pages.about.stats_labels.experience")}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-[280px]">
                  {t(`pages.about.developers.${dev.id}.desc`)}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="hover:text-accent hover:bg-accent/10 rounded-full" asChild>
                    <a href={t(`pages.about.developers.${dev.id}.github`)} target="_blank" rel="noopener noreferrer">
                      <Github className="w-5 h-5" />
                      <span className="sr-only">GitHub</span>
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:text-accent hover:bg-accent/10 rounded-full" asChild>
                    <a href={t(`pages.about.developers.${dev.id}.buymeacoffee`)} target="_blank" rel="noopener noreferrer">
                      <Coffee className="w-5 h-5" />
                      <span className="sr-only">Buy Me a Coffee</span>
                    </a>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {Array.isArray(skills) &&
                    skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-[10px] px-2 py-0 h-5 font-mono uppercase tracking-tight">
                        {skill}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
