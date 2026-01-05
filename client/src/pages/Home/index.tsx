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
    <div className="flex flex-col gap-6 p-6 lg:p-10 bg-zinc-950/20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
            <Zap className="w-8 h-8 text-accent fill-accent" />
            {selectedProject?.name || t("pages.home.title")}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">{t("pages.home.description")}</p>
          <p className="text-xs text-muted-foreground mt-1">
             Socket Status: <span className={socket ? "text-green-500" : "text-red-500"}>{socket ? "Connected" : "Disconnected"}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border-l border-zinc-800 pl-4 h-10">
          <span>
            {t("pages.home.active_commit")}: <span className="text-accent underline">7f3a21b</span>
          </span>
          <span className="text-zinc-800">|</span>
          <span>
            {t("pages.home.branch")}: <span className="text-accent underline">{selectedProject?.branch || "main"}</span>
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pipeline & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-widest">{t("pages.home.active_pipeline")}</h2>
            </div>
            <PipelineTimeline stages={stages} />
          </section>

          <section>
            <PipelineLogs logs={logs} />
          </section>
        </div>

        {/* Right Column: Controls & Stats */}
        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-widest">{t("pages.home.deployment_controls")}</h2>
            </div>
            <DeploymentControls
              onDeploy={handleDeploy}
              onRedeploy={() => {}}
              onRollback={() => {}}
              canDeploy={authUser?.role === "admin"}
              isDeploying={isDeploying}
            />
          </section>

          <section>
            <Card className="bg-background/50 border-border/50 shadow-2xl shadow-accent/5">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {t("pages.home.system_health.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("pages.home.system_health.uptime")}</span>
                  <span className="text-sm font-mono text-green-500">99.98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("pages.home.system_health.resp_time")}</span>
                  <span className="text-sm font-mono text-accent">142ms</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-accent h-full w-[85%] animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Bottom Section: History */}
        <div className="lg:col-span-3">
          <DeploymentHistory history={history} />
        </div>
      </div>
    </div>
  );
};
