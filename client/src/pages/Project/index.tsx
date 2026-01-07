import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PipelineTimeline, PipelineStage } from "../Home/components/PipelineTimeline";
import { PipelineLogs, LogEntry } from "../Home/components/PipelineLogs";
import { DeploymentControls } from "../Home/components/DeploymentControls";
import { DeploymentHistory, DeploymentRecord } from "../Home/components/DeploymentHistory";
import { Zap, Activity, Shield, Terminal, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/authContext";
import { useSocketContext } from "@/contexts/socketContext";
import { useProjectContext } from "@/contexts/projectContext";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { axiosConfig } from "@/config/axiosConfig";

export const Project = () => {
  const { t } = useTranslation();
  const { authUser } = useAuthContext();
  const { socket } = useSocketContext();
  const { projects, loading } = useProjectContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeploying, setIsDeploying] = useState(false);

  const selectedProject = projects.find((p) => p._id === id);

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
  const [history, setHistory] = useState<DeploymentRecord[]>([]);

  const fetchHistory = async () => {
    if (!selectedProject) return;
    try {
      const response = await axiosConfig.get(`/pipelines/project/${selectedProject._id}`);
      const mappedHistory: DeploymentRecord[] = response.data.map((p: any) => {
        let startTime = p.createdAt;
        let durationStr = "---";

        if (p.jobs && p.jobs.length > 0) {
          const startTimes = p.jobs.map((j: any) => new Date(j.startTime).getTime()).filter((t: number) => !isNaN(t));
          const endTimes = p.jobs.map((j: any) => new Date(j.endTime).getTime()).filter((t: number) => !isNaN(t));

          if (startTimes.length > 0) {
            const minStart = Math.min(...startTimes);
            startTime = new Date(minStart).toISOString();

            if (endTimes.length > 0) {
              const maxEnd = Math.max(...endTimes);
              const durationMs = maxEnd - minStart;
              const minutes = Math.floor(durationMs / 60000);
              const seconds = Math.floor((durationMs % 60000) / 1000);
              durationStr = `${minutes}m ${seconds}s`;
            }
          }
        }

        return {
          id: p._id,
          commitHash: p.commitHash ? p.commitHash.substring(0, 7) : "---",
          trigger: p.commitHash ? "github" : "manual",
          environment: "production",
          status: p.status.toLowerCase() as any,
          duration: durationStr,
          deployedBy: p.author || "System",
          timestamp: new Date(startTime).toLocaleString(),
        };
      });
      setHistory(mappedHistory.reverse());
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedProject]);

  useEffect(() => {
    if (!socket) return;

    socket.on("pipeline-log", (log: LogEntry) => {
      setLogs((prev) => [...prev, log]);

      // Heureustics to update stages based on log message
      const msg = log.message.toLowerCase();
      let currentStageId = "";

      if (msg.includes("cloning") || msg.includes("checkout") || msg.includes("fetching repo")) {
        currentStageId = "1"; // Source
      } else if (msg.includes("install") || msg.includes("building") || msg.includes("compiling")) {
        currentStageId = "2"; // Build
      } else if (msg.includes("test") || msg.includes("vitest") || msg.includes("jest")) {
        currentStageId = "3"; // Tests
      } else if (msg.includes("docker") || msg.includes("building image") || msg.includes("pushing to registry")) {
        currentStageId = "4"; // Docker
      } else if (msg.includes("deploying") || msg.includes("updating service") || msg.includes("restarting")) {
        currentStageId = "5"; // Deploy
      }

      if (currentStageId) {
        setStages((prev) =>
          prev.map((stage) => {
            const stageNum = parseInt(stage.id);
            const currentNum = parseInt(currentStageId);

            if (stageNum < currentNum && stage.status !== "success") {
              return { ...stage, status: "success" };
            }
            if (stageNum === currentNum) {
              return { ...stage, status: "running" };
            }
            return stage;
          }),
        );
      }
    });

    socket.on("pipeline-status", ({ stageId, status }: { stageId: string; status: PipelineStage["status"] }) => {
      setStages((prev) => prev.map((stage) => (stage.id === stageId ? { ...stage, status } : stage)));
    });

    socket.on("pipeline-completed", ({ success }: { success: boolean }) => {
      setIsDeploying(false);
      setStages((prev) =>
        prev.map((stage) => {
          if (success) {
            return { ...stage, status: "success" };
          } else {
            // If failed, the currently running stage should be marked as failed
            return stage.status === "running" ? { ...stage, status: "failed" } : stage;
          }
        }),
      );
      fetchHistory(); // Refresh history when completed
    });

    return () => {
      socket.off("pipeline-log");
      socket.off("pipeline-status");
      socket.off("pipeline-completed");
    };
  }, [socket]);

  const handleDeploy = async () => {
    if (!selectedProject) return;

    try {
      setIsDeploying(true);
      setLogs([]);
      setStages(initialStages.map((s, i) => (i === 0 ? { ...s, status: "running" } : s)));

      const response = await axiosConfig.post("/webhooks/trigger", {
        projectId: selectedProject._id,
      });

      toast.success(t("pages.home.toasts.deploy_started"));
      console.log(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.error);
      setIsDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Activity className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">{t("pages.project.not_found")}</h1>
        <Button onClick={() => navigate("/")}>{t("pages.project.go_home")}</Button>
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
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-2 bg-accent rounded-xl shadow-lg shadow-accent/20">
              <Zap className="w-6 h-6 text-accent-foreground fill-accent-foreground" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">{selectedProject?.name}</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium pl-11">{selectedProject.repoUrl}</p>
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
                canDeploy={authUser?.role === "admin"} // Or check project permissions
                isDeploying={isDeploying}
              />
            </div>
          </section>

          {/*<section className="space-y-4">
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
                    <span>{t("pages.project.server_capacity")}</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                    <div className="bg-accent h-full w-[85%] animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          */}
        </div>

        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.project.live_output_stream")}</h2>
          </div>
          <div className="rounded-[2rem] overflow-hidden border border-border/50 shadow-xl shadow-black/5 bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md">
            <PipelineLogs logs={logs} />
          </div>
        </section>

        {/* Bottom Section: History */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.history.title")}</h2>
          </div>

          <div className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 p-2 shadow-xl shadow-black/5 overflow-hidden">
            <DeploymentHistory history={history} />
          </div>
        </div>
      </div>
    </div>
  );
};
