import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PipelineTimeline, PipelineStage } from "../Home/components/PipelineTimeline";
import { PipelineLogs, LogEntry } from "../Home/components/PipelineLogs";
import { DeploymentControls } from "../Home/components/DeploymentControls";
import { DeploymentHistory, DeploymentRecord } from "../Home/components/DeploymentHistory";
import { Zap, Activity, Shield, Terminal, ArrowLeft, Search, Eye, Boxes, Container, Rocket, ShieldAlert, Github } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/authContext";
import { useSocketContext } from "@/contexts/socketContext";
import { useProjectContext } from "@/contexts/projectContext";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { axiosConfig } from "@/config/axiosConfig";
import { cn } from "@/lib/utils";

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
    { id: "1", name: "Clone", status: "pending", icon: Zap },
    { id: "2", name: "Eslint", status: "pending", icon: Search },
    { id: "3", name: "Sonar", status: "pending", icon: Eye },
    { id: "4", name: "Kubernetes", status: "pending", icon: Boxes },
    { id: "5", name: "Docker", status: "pending", icon: Container },
    { id: "6", name: "Déploiement", status: "pending", icon: Rocket },
    { id: "7", name: "Tests Intrusions", status: "pending", icon: ShieldAlert },
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
          commitHash: p.commitHash || "---",
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

      // Heuristics to update stages based on log message
      const msg = log.message.toLocaleLowerCase();
      let currentStageId = "";
      let isSuccess = false;
      let isFailed = false;

      // Detection of "Starting" markers (explicit from some runners)
      if (msg.includes("step [git-clone] starting") || msg.includes("cloning") || msg.includes("checkout")) {
        currentStageId = "1";
      } else if (msg.includes("step [eslint] starting") || msg.includes("eslint") || msg.includes("linting")) {
        currentStageId = "2";
      } else if (msg.includes("step [sonar] starting") || msg.includes("sonar") || msg.includes("analysis")) {
        currentStageId = "3";
      } else if (msg.includes("step [kubernetes] starting") || msg.includes("k8s") || msg.includes("kubectl")) {
        currentStageId = "4";
      } else if (msg.includes("step [docker-build] starting") || msg.includes("building docker image") || msg.includes("docker build")) {
        currentStageId = "5";
      } else if (msg.includes("step [deploy] starting") || msg.includes("deploying") || msg.includes("deployment")) {
        currentStageId = "6";
      } else if (
        msg.includes("step [intrusion-tests] starting") ||
        msg.includes("security") ||
        msg.includes("zap") ||
        msg.includes("penetration")
      ) {
        currentStageId = "7";
      }

      // Detection of "Finished" markers
      const finishedMatch = log.message.match(/--- Step \[(.+)\] Finished \(Exit: (\d+)\) ---/);
      if (finishedMatch) {
        const stepName = finishedMatch[1];
        const exitCode = parseInt(finishedMatch[2]);
        let finishedStageId = "";

        if (stepName === "git-clone") finishedStageId = "1";
        else if (stepName === "eslint") finishedStageId = "2";
        else if (stepName === "sonar") finishedStageId = "3";
        else if (stepName === "kubernetes-prep") finishedStageId = "4";
        else if (stepName === "docker-build") finishedStageId = "5";
        else if (stepName === "deploy") finishedStageId = "6";
        else if (stepName === "intrusion-tests") finishedStageId = "7";

        if (finishedStageId) {
          setStages((prev) => {
            const newStages: PipelineStage[] = prev.map((stage) => {
              if (stage.id === finishedStageId) {
                return { ...stage, status: (exitCode === 0 ? "success" : "failed") as PipelineStage["status"] };
              }
              return stage;
            });

            // Automatically start the next stage if the current one was successful
            if (exitCode === 0) {
              const currentIdx = prev.findIndex((s) => s.id === finishedStageId);
              if (currentIdx !== -1 && currentIdx < prev.length - 1) {
                const nextStage = newStages[currentIdx + 1];
                if (nextStage.status === "pending") {
                  nextStage.status = "running";
                }
              }
            }

            return newStages;
          });
          return; // Skip the generic transition logic
        }
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
              if (stage.status !== "success" && stage.status !== "failed") {
                return { ...stage, status: "running" };
              }
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

    socket.on("pipeline-started", () => {
      fetchHistory();
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

      toast.success(t("pages.project.toasts.deploy_started"));
      console.log(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.error);
      setIsDeploying(false);
    }
  };

  // Calculate real stats from history
  const stats = {
    successRate: history.length > 0 ? Math.round((history.filter((h) => h.status === "success").length / history.length) * 100) : 0,
    avgDuration:
      history.length > 0
        ? (() => {
            const durations = history
              .filter((h) => h.duration !== "---")
              .map((h) => {
                const [m, s] = h.duration.replace("m", "").replace("s", "").split(" ").map(Number);
                return m * 60 + s;
              });
            if (durations.length === 0) return "---";
            const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
            return avg > 60 ? `${Math.floor(avg / 60)}m ${avg % 60}s` : `${avg}s`;
          })()
        : "---",
    totalDeployments: history.length,
    failedDeploys: history.filter((h) => h.status === "failed").length,
    weeklyDeployments: history.filter((h) => {
      const deployDate = new Date(h.timestamp);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return deployDate >= sevenDaysAgo;
    }).length,
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
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-accent/10 hover:text-accent transition-all active:scale-95 rounded-xl h-12 w-12"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent rounded-2xl shadow-lg shadow-accent/20">
              <Zap className="w-8 h-8 text-accent-foreground fill-accent-foreground" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
                {selectedProject?.name}
                <a
                  href={selectedProject.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors group"
                  title="View on GitHub"
                >
                  <Github className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-all" />
                </a>
              </h1>
              <p className="text-muted-foreground text-xs font-mono opacity-60 truncate max-w-[300px]">{selectedProject.repoUrl}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted/50 px-4 py-2.5 rounded-full border border-border/50 shadow-sm backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {t("pages.home.active_commit")}:{" "}
            <span className="text-accent underline underline-offset-4 decoration-2">
              {history.find((h) => h.status === "success")?.commitHash.substring(0, 7) || "---"}
            </span>
          </span>
          <span className="text-zinc-300 dark:text-zinc-800 font-normal">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {t("pages.home.branch")}:{" "}
            <span className="text-accent underline underline-offset-4 decoration-2">{selectedProject?.branch || "main"}</span>
          </span>
        </div>
      </header>

      <div className="space-y-10 relative z-10">
        {/* Row 1: Controls & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Controls - Left (1/3) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.deployment_controls")}</h2>
            </div>
            <div className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 p-8 shadow-xl shadow-black/5 h-full flex flex-col justify-center">
              <DeploymentControls
                onDeploy={handleDeploy}
                onRedeploy={() => {}}
                onRollback={() => {}}
                canDeploy={authUser?.role === "admin"}
                isDeploying={isDeploying}
              />
            </div>
          </section>

          {/* Stats - Right (2/3) */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 ml-1">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.system_health.title")}</h2>
            </div>
            <Card className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border-border/50 shadow-xl shadow-black/5 border-none h-full">
              <CardContent className="p-10 flex flex-col md:flex-row gap-12 justify-center items-center h-full">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-green-500/10 rounded-[2rem]">
                    <Activity className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t("pages.home.system_health.success_rate")}
                    </p>
                    <p className="text-3xl font-black font-mono text-green-500">{stats.successRate}%</p>
                  </div>
                </div>

                <div className="hidden md:block w-px h-12 bg-border/50" />

                <div className="flex items-center gap-6">
                  <div className="p-4 bg-accent/10 rounded-[2rem]">
                    <Rocket className="w-8 h-8 text-accent" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t("pages.home.system_health.avg_duration")}
                    </p>
                    <p className="text-3xl font-black font-mono text-accent">{stats.avgDuration}</p>
                  </div>
                </div>

                <div className="hidden md:block w-px h-12 bg-border/50" />

                <div className="flex items-center gap-6">
                  <div className="p-4 bg-blue-500/10 rounded-[2rem]">
                    <Zap className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t("pages.home.system_health.total_deployments")}
                    </p>
                    <p className="text-3xl font-black font-mono text-blue-500">{stats.totalDeployments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Row 2: Pipeline Timeline (Full Width) */}
        <section className="space-y-4 pt-10">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.active_pipeline")}</h2>
          </div>
          <div className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 p-10 shadow-xl shadow-black/5">
            <PipelineTimeline stages={stages} />
          </div>
        </section>

        {/* Row 3: Logs (Full Width) */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.project.live_output_stream")}</h2>
          </div>
          <div className="rounded-[2.5rem] overflow-hidden border border-border/50 shadow-xl shadow-black/5 bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md">
            <PipelineLogs logs={logs} />
          </div>
        </section>

        {/* Row 4: History (Full Width) */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.history.title")}</h2>
          </div>
          <div className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 p-2 shadow-xl shadow-black/5 overflow-hidden">
            <DeploymentHistory history={history} repoUrl={selectedProject?.repoUrl} />
          </div>
        </section>
      </div>
    </div>
  );
};
