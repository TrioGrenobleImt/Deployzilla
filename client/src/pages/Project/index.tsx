import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PipelineTimeline, PipelineStage } from "../Home/components/PipelineTimeline";
import { PipelineLogs, LogEntry } from "../Home/components/PipelineLogs";
import { DeploymentControls } from "../Home/components/DeploymentControls";
import { DeploymentHistory, DeploymentRecord } from "../Home/components/DeploymentHistory";
import { RollbackDialog } from "../Home/components/RollbackDialog";
import {
  Zap,
  Activity,
  Shield,
  Terminal,
  ArrowLeft,
  Search,
  Eye,
  Boxes,
  Container,
  Rocket,
  ShieldAlert,
  Github,
  Package,
  FlaskConical,
} from "lucide-react";
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
    { id: "1", name: "Clone", status: "pending", icon: Zap },
    { id: "2", name: "Dépendances", status: "pending", icon: Package },
    { id: "3", name: "Eslint", status: "pending", icon: Search },
    { id: "4", name: "Tests unitaires", status: "pending", icon: FlaskConical },
    { id: "5", name: "Sonarqube", status: "pending", icon: Activity },
    { id: "6", name: "Build", status: "pending", icon: Container },
    { id: "7", name: "Déploiement", status: "pending", icon: Rocket },
    { id: "8", name: "Tests Intrusions", status: "pending", icon: ShieldAlert },
  ];

  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<DeploymentRecord[]>([]);

  const fetchHistory = async () => {
    if (!selectedProject) return;
    try {
      const response = await axiosConfig.get(`/pipelines/project/${selectedProject._id}`);
      const mappedHistory: DeploymentRecord[] = response.data
        .map((p: any) => {
          const createdAt = p.createdAt;
          let durationStr = "---";

          // Calculate duration from job startTime/endTime
          if (p.jobs && p.jobs.length > 0) {
            const startTimes = p.jobs.map((j: any) => new Date(j.startTime).getTime()).filter((t: number) => !isNaN(t));
            const endTimes = p.jobs.map((j: any) => new Date(j.endTime).getTime()).filter((t: number) => !isNaN(t));

            if (startTimes.length > 0 && endTimes.length > 0) {
              const minStart = Math.min(...startTimes);
              const maxEnd = Math.max(...endTimes);
              const durationMs = maxEnd - minStart;
              const minutes = Math.floor(durationMs / 60000);
              const seconds = Math.floor((durationMs % 60000) / 1000);
              durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            }
          }

          // For running pipelines
          if ((p.status === "RUNNING" || p.status === "PENDING") && durationStr === "---") {
            durationStr = "En cours...";
          }

          // timestamps
          const getTimestampFromId = (id: string) => parseInt(id.substring(0, 8), 16) * 1000;
          let startTime = createdAt ? new Date(createdAt).getTime() : 0;
          if (!startTime && p._id) {
            startTime = getTimestampFromId(p._id);
          }

          return {
            id: p._id,
            commitHash: p.commitHash || "---",
            trigger: (p.trigger ? p.trigger : p.commitHash ? "github" : "manual") as "github" | "manual",
            environment: "production",
            status: p.status.toLowerCase() as any,
            duration: durationStr,
            deployedBy: p.author || "System",
            timestamp: startTime ? new Date(startTime).toLocaleString() : "---",
            startTime: startTime,
            _sortTime: startTime,
          };
        })
        .sort((a: any, b: any) => b._sortTime - a._sortTime)
        .map(({ _sortTime, ...rest }: any) => rest);

      setHistory(mappedHistory);

      // Restore timeline state from most recent running/pending pipeline
      const sortedPipelines = [...response.data].sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      const runningPipeline = sortedPipelines.find((p: any) => p.status === "RUNNING" || p.status === "PENDING");

      if (runningPipeline) {
        console.log("Found running pipeline:", runningPipeline._id, "currentStage:", runningPipeline.currentStage);
        setIsDeploying(true);

        // Use currentStage to restore the timeline
        restoreTimelineFromCurrentStage(runningPipeline.currentStage);

        // Restore logs from the pipeline
        if (runningPipeline.logs && Array.isArray(runningPipeline.logs)) {
          // Deduplicate logs from DB
          const uniqueLogs = Array.from(new Map(runningPipeline.logs.map((l: any) => [l.id, l])).values()) as LogEntry[];
          setLogs(uniqueLogs);
        }
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // Restore timeline stages based on currentStage from pipeline
  const restoreTimelineFromCurrentStage = (currentStage: string | undefined) => {
    if (!currentStage) {
      console.log("No currentStage to restore from");
      return;
    }

    const stageMap: { [key: string]: string } = {
      // Clone stage
      "git-clone": "1",
      "GIT-CLONE": "1",
      CLONE: "1",
      clone: "1",
      // Dependencies stage
      "npm-install": "2",
      "NPM-INSTALL": "2",
      DEPENDENCIES: "2",
      dependencies: "2",
      // ESLint stage
      eslint: "3",
      ESLINT: "3",
      "NPM-LINT": "3",
      "npm-lint": "3",
      // Unit Tests stage
      "unit-tests": "4",
      "UNIT-TESTS": "4",
      TESTS: "4",
      tests: "4",
      "NPM-TEST": "4",
      "npm-test": "4",
      // SonarQube stage
      sonarqube: "5",
      SONARQUBE: "5",
      SONAR: "5",
      sonar: "5",
      // Build stage
      "docker-build": "6",
      "DOCKER-BUILD": "6",
      BUILD: "6",
      build: "6",
      // Deploy stage
      deploy: "7",
      DEPLOY: "7",
      "kubernetes-prep": "7",
      "KUBERNETES-PREP": "7",
      // Intrusion Tests stage
      "intrusion-tests": "8",
      "INTRUSION-TESTS": "8",
      INTRUSION: "8",
      intrusion: "8",
    };

    const runningStageId = stageMap[currentStage] || stageMap[currentStage.toUpperCase()];
    console.log("Restoring from currentStage:", currentStage, "-> stageId:", runningStageId);

    if (!runningStageId) {
      console.log("Could not map currentStage to stageId");
      return;
    }

    const runningStageNum = parseInt(runningStageId);
    const updatedStages = initialStages.map((stage) => {
      const stageNum = parseInt(stage.id);
      if (stageNum < runningStageNum) {
        // Previous stages are success
        return { ...stage, status: "success" as PipelineStage["status"] };
      } else if (stageNum === runningStageNum) {
        // Current stage is running
        return { ...stage, status: "running" as PipelineStage["status"] };
      }
      // Future stages remain pending
      return stage;
    });

    setStages(updatedStages);
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedProject]);

  useEffect(() => {
    if (!socket) return;

    socket.on("pipeline-log", (log: LogEntry) => {
      // Only add logs - stage transitions come from pipeline-status via Redis
      setLogs((prev) => {
        if (prev.some((l) => l.id === log.id)) return prev;
        return [...prev, log];
      });
    });

    socket.on(
      "pipeline-status",
      ({ stageId, status, projectId }: { stageId: string; status: PipelineStage["status"]; projectId?: string }) => {
        if (projectId && projectId !== id) return;
        setStages((prev) =>
          prev.map((stage) => {
            // If this is the stage being updated, set its status
            if (stage.id === stageId) {
              return { ...stage, status };
            }
            // If a new stage is running, mark all previous stages as success
            if (status === "running") {
              const stageNum = parseInt(stage.id);
              const currentNum = parseInt(stageId);
              if (stageNum < currentNum && stage.status !== "success" && stage.status !== "failed") {
                return { ...stage, status: "success" };
              }
            }
            return stage;
          }),
        );
      },
    );

    socket.on("pipeline-updated", ({ projectId }: { projectId: string }) => {
      if (projectId === id) {
        fetchHistory();
      }
    });

    socket.on("pipeline-completed", ({ success, projectId, pipeline }: { success: boolean; projectId?: string; pipeline?: any }) => {
      if (projectId && projectId !== id) return;

      setIsDeploying(false);
      setStages((prev) =>
        prev.map((stage) => {
          if (success) {
            return { ...stage, status: "success" };
          } else {
            return stage.status === "running" ? { ...stage, status: "failed" } : stage;
          }
        }),
      );

      // Update history and stats with real data from DB
      if (pipeline) {
        const createdAt = pipeline.createdAt;
        const updatedAt = pipeline.updatedAt;
        let durationStr = "---";

        // Calculate duration from job startTime/endTime
        if (pipeline.jobs && Array.isArray(pipeline.jobs) && pipeline.jobs.length > 0) {
          const startTimes = pipeline.jobs.map((j: any) => new Date(j.startTime).getTime()).filter((t: number) => !isNaN(t));
          const endTimes = pipeline.jobs.map((j: any) => new Date(j.endTime).getTime()).filter((t: number) => !isNaN(t));

          if (startTimes.length > 0 && endTimes.length > 0) {
            const minStart = Math.min(...startTimes);
            const maxEnd = Math.max(...endTimes);
            const durationMs = maxEnd - minStart;
            const minutes = Math.floor(durationMs / 60000);
            const seconds = Math.floor((durationMs % 60000) / 1000);
            durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          }
        }

        const completedRecord: DeploymentRecord = {
          id: pipeline._id,
          commitHash: pipeline.commitHash || "---",
          trigger: (pipeline.trigger ? pipeline.trigger : pipeline.commitHash ? "github" : "manual") as "github" | "manual",
          environment: "production",
          status: pipeline.status.toLowerCase() as any,
          duration: durationStr,
          deployedBy: pipeline.author || "System",
          timestamp: createdAt ? new Date(createdAt).toLocaleString() : "---",
        };

        // Replace the in-progress row with the completed one
        setHistory((prev) => {
          const filtered = prev.filter((h) => h.id !== pipeline._id);
          return [completedRecord, ...filtered];
        });
      } else {
        // Fallback to fetching all history
        fetchHistory();
      }
    });

    socket.on("pipeline-started", ({ projectId, pipelineId, pipeline }: { projectId: string; pipelineId: string; pipeline?: any }) => {
      if (projectId !== id) return;

      // Add an "in progress" row to history
      if (pipeline) {
        // timestamps
        const getTimestampFromId = (id: string) => parseInt(id.substring(0, 8), 16) * 1000;
        let startTime = pipeline.createdAt ? new Date(pipeline.createdAt).getTime() : 0;
        if (!startTime && pipeline._id) {
          startTime = getTimestampFromId(pipeline._id);
        }
        if (!startTime) startTime = Date.now(); // Ultimate fallback

        const inProgressRecord: DeploymentRecord = {
          id: pipeline._id,
          commitHash: pipeline.commitHash || "---",
          trigger: (pipeline.trigger ? pipeline.trigger : pipeline.commitHash ? "github" : "manual") as "github" | "manual",
          environment: "production",
          status: "running" as any,
          duration: "En cours...",
          deployedBy: pipeline.author || "System",
          timestamp: startTime ? new Date(startTime).toLocaleString() : new Date().toLocaleString(),
          startTime: startTime,
        };

        setHistory((prev) => {
          if (prev.some((h) => h.id === inProgressRecord.id)) return prev;
          return [inProgressRecord, ...prev];
        });
      }
    });

    return () => {
      socket.off("pipeline-log");
      socket.off("pipeline-status");
      socket.off("pipeline-updated");
      socket.off("pipeline-completed");
      socket.off("pipeline-started");
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
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.error);
      setIsDeploying(false);
    }
  };

  const handleRollback = async (commitHash: string) => {
    if (!selectedProject) return;

    try {
      setIsDeploying(true);
      setLogs([]);
      // Optimistic update for timeline
      setStages(initialStages.map((s, i) => (i === 0 ? { ...s, status: "running" } : s)));

      const response = await axiosConfig.post("/webhooks/trigger", {
        projectId: selectedProject._id,
        commitHash, // Pass the specific commit hash
      });

      toast.success(t("pages.project.toasts.rollback_started"));
      console.log(response.data.message);
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.error);
      setIsDeploying(false);
    }
  };

  const [showRollback, setShowRollback] = useState(false);

  // Calculate real stats from history (exclude running/pending for stats)
  const completedHistory = history.filter((h) => h.status !== "running" && h.status !== "pending");

  const stats = {
    successRate:
      completedHistory.length > 0
        ? Math.round((completedHistory.filter((h) => h.status === "success").length / completedHistory.length) * 100)
        : 0,
    avgDuration:
      completedHistory.length > 0
        ? (() => {
            const durations = completedHistory
              .filter((h) => h.duration !== "---")
              .map((h) => {
                const parts = h.duration.replace("m", "").replace("s", "").split(" ").map(Number);
                // Handle cases where duration parsing might fail or partial string
                if (parts.some(isNaN)) return 0;
                // If format is "Xm Ys" -> [X, Y]. If "Ys" -> [Y]
                if (parts.length === 2) return parts[0] * 60 + parts[1];
                if (parts.length === 1) return parts[0];
                return 0;
              })
              .filter((d) => d > 0);
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
                onRollback={() => setShowRollback(true)}
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

        {/* Row 2: Pipeline Timeline (1/4) + Logs (3/4) Side-by-Side */}
        <section className="space-y-4 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Timeline - 1/4 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-6 bg-accent rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.active_pipeline")}</h2>
              </div>
              <div className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 p-6 shadow-xl shadow-black/5 h-full">
                <PipelineTimeline stages={stages} orientation="vertical" />
              </div>
            </div>

            {/* Logs - 3/4 */}
            <div className="lg:col-span-3 space-y-4 ">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1.5 h-6 bg-accent rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {t("pages.project.live_output_stream")}
                </h2>
              </div>
              <div className="rounded-[2.5rem] overflow-hidden border border-border/50 shadow-xl shadow-black/5 bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md h-full">
                <PipelineLogs logs={logs} />
              </div>
            </div>
          </div>
        </section>

        {/* Row 4: History (Full Width) */}
        <section className="space-y-4 pt-10">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t("pages.home.history.title")}</h2>
          </div>
          <div className="bg-background/60 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] border border-border/50 p-2 shadow-xl shadow-black/5 overflow-hidden">
            <DeploymentHistory history={history} repoUrl={selectedProject?.repoUrl} />
          </div>
        </section>
      </div>

      <RollbackDialog isOpen={showRollback} onClose={() => setShowRollback(false)} onConfirm={handleRollback} history={history} />
    </div>
  );
};
