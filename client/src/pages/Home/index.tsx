import { useState, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import { PipelineTimeline, PipelineStage } from "./components/PipelineTimeline";
import { PipelineLogs, LogEntry } from "./components/PipelineLogs";
import { DeploymentControls } from "./components/DeploymentControls";
import { DeploymentHistory, DeploymentRecord } from "./components/DeploymentHistory";
import { Zap, Activity, Shield, Terminal, FolderPlus, UserCog } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/authContext";
import { useSocketContext } from "@/contexts/socketContext";
import { useProjectContext } from "@/contexts/projectContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const { t } = useTranslation();
  const { authUser } = useAuthContext();
  const { socket } = useSocketContext();
  const { selectedProject, projects, loading } = useProjectContext();
  const navigate = useNavigate();
  const [isDeploying, setIsDeploying] = useState(false);

  // Initial Stages
  const initialStages: PipelineStage[] = [
    { id: "1", name: "Source", status: "pending", icon: Zap },
    { id: "2", name: "Build", status: "pending", icon: Activity },
    { id: "3", name: "Tests", status: "pending", icon: Shield },
    { id: "4", name: "Docker", status: "pending", icon: Terminal },
    { id: "5", name: "Deploy", status: "pending", icon: Zap },
  ];

  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on("pipeline-log", (log: LogEntry) => {
      setLogs((prev) => [...prev, log]);
    });

    socket.on("pipeline-status", ({ stageId, status }: { stageId: string; status: PipelineStage["status"] }) => {
      setStages((prev) =>
        prev.map((stage) => (stage.id === stageId ? { ...stage, status } : stage))
      );
    });

    socket.on("pipeline-completed", () => {
      setIsDeploying(false);
    });

    return () => {
      socket.off("pipeline-log");
      socket.off("pipeline-status");
      socket.off("pipeline-completed");
    };
  }, [socket]);

  const history: DeploymentRecord[] = [
    {
      id: "d1",
      commitHash: "7f3a21b",
      trigger: "github",
      environment: "production",
      status: "success",
      duration: "4m 20s",
      deployedBy: "GitHub Actions",
      timestamp: "2026-01-05 10:45",
    },
    {
      id: "d2",
      commitHash: "a2d1f0c",
      trigger: "manual",
      environment: "staging",
      status: "success",
      duration: "3m 55s",
      deployedBy: "Admin",
      timestamp: "2026-01-05 09:12",
    },
    {
      id: "d3",
      commitHash: "e4f8a9d",
      trigger: "github",
      environment: "production",
      status: "failed",
      duration: "2m 10s",
      deployedBy: "GitHub Actions",
      timestamp: "2024-01-04 18:30",
    },
  ];

  const handleDeploy = () => {
    console.log("Handle deploy clicked");
    if (!socket) {
        console.error("Socket is null!");
        return;
    }
    console.log("Emitting start-pipeline event");
    setIsDeploying(true);setLogs([]);
    setStages(initialStages); 
    // Reset UI
    socket.emit("start-pipeline");
    // Simulation logic could go here
    setTimeout(() => setIsDeploying(false), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Activity className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    const isAdmin = authUser?.role === "admin";
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-full" />
          {isAdmin ? <FolderPlus className="w-24 h-24 text-accent relative" /> : <UserCog className="w-24 h-24 text-accent relative" />}
        </div>

        <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-4">
          {isAdmin ? t("pages.home.empty_state.admin.title") : t("pages.home.empty_state.user.title")}
        </h1>

        <p className="max-w-md text-muted-foreground text-lg mb-10 leading-relaxed font-medium">
          {isAdmin ? t("pages.home.empty_state.admin.description") : t("pages.home.empty_state.user.description")}
        </p>

        {isAdmin && (
          <Button
            size="lg"
            onClick={() => navigate("/admin/projects")}
            className="h-12 px-8 bg-accent text-accent-foreground font-black uppercase tracking-widest hover:scale-105 transition-transform"
          >
            {t("pages.home.empty_state.admin.button")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-8 p-6 lg:p-10 min-h-screen bg-transparent overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 blur-[100px] rounded-full -z-10 -translate-x-1/2 translate-y-1/2" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-8 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-xl shadow-lg shadow-accent/20">
              <Zap className="w-6 h-6 text-accent-foreground fill-accent-foreground" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
              {selectedProject?.name || t("pages.home.title")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium pl-11">{t("pages.home.description")}</p>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted/50 px-4 py-2.5 rounded-full border border-border/50 shadow-sm backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {t("pages.home.active_commit")}: <span className="text-accent underline underline-offset-4 decoration-2">7f3a21b</span>
          </span>
          <span className="text-zinc-300 dark:text-zinc-800 font-normal">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {t("pages.home.branch")}:{" "}
            <span className="text-accent underline underline-offset-4 decoration-2">{selectedProject?.branch || "main"}</span>
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Left Column: Pipeline & Logs */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.active_pipeline")}</h2>
            </div>
            <div className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2rem] border border-border/50 p-8 shadow-xl shadow-black/5">
              <PipelineTimeline stages={stages} />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Live Output Stream</h2>
            </div>
            <div className="rounded-[2rem] overflow-hidden border border-border/50 shadow-xl shadow-black/5 bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md">
              <PipelineLogs logs={logs} />
            </div>
          </section>
        </div>

        {/* Right Column: Controls & Stats */}
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.deployment_controls")}</h2>
            </div>
            <div className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2rem] border border-border/50 p-6 shadow-xl shadow-black/5">
              <DeploymentControls
                onDeploy={handleDeploy}
                onRedeploy={() => {}}
                onRollback={() => {}}
                canDeploy={authUser?.role === "admin"}
                isDeploying={isDeploying}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.system_health.title")}</h2>
            </div>
            <Card className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2rem] border-border/50 shadow-xl shadow-black/5">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t("pages.home.system_health.uptime")}
                    </p>
                    <p className="text-2xl font-black font-mono text-green-500">99.98%</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-2xl">
                    <Activity className="w-6 h-6 text-green-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t("pages.home.system_health.resp_time")}
                    </p>
                    <p className="text-2xl font-black font-mono text-accent">142ms</p>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-2xl">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Server Capacity</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                    <div className="bg-accent h-full w-[85%] animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Bottom Section: History */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Deployment Archive</h2>
          </div>
          <div className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 p-2 shadow-xl shadow-black/5 overflow-hidden">
            <DeploymentHistory history={history} />
          </div>
        </div>
      </div>
    </div>
  );
};
