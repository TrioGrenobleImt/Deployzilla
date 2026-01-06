import { useTranslation } from "react-i18next";
import { useProjectContext } from "@/contexts/projectContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Folder, GitBranch, ArrowRight, Activity, Clock, Plus } from "lucide-react";
import { useAuthContext } from "@/contexts/authContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjectForm } from "../Admin/components/projects/projectForm";
import { useState } from "react";

export const Home = () => {
  const { t } = useTranslation();
  const { projects, loading, refreshProjects } = useProjectContext();
  const { authUser } = useAuthContext();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Activity className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">{t("pages.home.title", "My Projects")}</h1>
        <p className="text-muted-foreground text-lg">
          {t("pages.home.subtitle", "Select a project to view its dashboard and deployments.")}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border border-dashed border-border/50 rounded-3xl bg-muted/20 p-10">
          <Folder className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold mb-2">{t("pages.home.no_projects_title")}</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-sm">
            {authUser?.role === "admin" ? t("pages.home.no_projects_admin") : t("pages.home.no_projects")}
          </p>
          {authUser?.role === "admin" && <Button onClick={() => navigate("/admin/projects")}>{t("pages.home.go_to_admin")}</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project._id}
              className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-sm transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 cursor-pointer"
              onClick={() => navigate(`/project/${project._id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-primary/10 rounded-xl mb-2 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    <Folder className="w-6 h-6" />
                  </div>
                  {project.autoDeploy && (
                    <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/5">
                      {t("pages.home.auto_deploy")}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-bold tracking-tight">{project.name}</CardTitle>
                <CardDescription className="line-clamp-1 font-mono text-xs mt-1">{project.repoUrl}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4" />
                    <span>{project.branch}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{t("pages.home.updated_recently")}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="transparent"
                    size="sm"
                    className="gap-2 group-hover:text-accent group-hover:translate-x-1 transition-all"
                  >
                    {t("pages.home.view_dashboard")} <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {authUser?.role === "admin" && (
            <Card
              className="group relative overflow-hidden border-dashed border-border/50 bg-background/30 hover:bg-accent/5 backdrop-blur-sm transition-all hover:border-accent/50 cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[200px]"
              onClick={() => setOpenDialog(true)}
            >
              <div className="p-4 bg-accent/10 rounded-full group-hover:bg-accent group-hover:scale-110 transition-all duration-100">
                <Plus className="w-8 h-8 text-accent group-hover:text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-muted-foreground group-hover:text-accent transition-colors">
                {t("pages.home.create_project")}
              </h3>
            </Card>
          )}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("pages.home.create_project")}</DialogTitle>
          </DialogHeader>
          <ProjectForm dialog={setOpenDialog} refresh={refreshProjects} action="create" />
        </DialogContent>
      </Dialog>
    </div>
  );
};
