import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PipelineTimeline, PipelineStage } from "./components/PipelineTimeline";
import { PipelineLogs, LogEntry } from "./components/PipelineLogs";
import { DeploymentControls } from "./components/DeploymentControls";
import { DeploymentHistory, DeploymentRecord } from "./components/DeploymentHistory";
import { Zap, Activity, Shield, Terminal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/authContext";

export const Home = () => {
  const { t } = useTranslation();
  const { authUser } = useAuthContext();
  const [isDeploying, setIsDeploying] = useState(false);

  // Mock Data
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: "1", name: "Source", status: "success", duration: "12s", icon: Zap },
    { id: "2", name: "Build", status: "success", duration: "1m 45s", icon: Activity },
    { id: "3", name: "Tests", status: "success", duration: "2m 10s", icon: Shield },
    { id: "4", name: "Docker", status: "running", icon: Terminal },
    { id: "5", name: "Deploy", status: "pending", icon: Zap },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", timestamp: "10:55:01", level: "info", message: "Fetching source from GitHub...", step: "Source" },
    {
      id: "2",
      timestamp: "10:55:14",
      level: "success",
      message: "Source fetched successfully (branch: main, commit: 7f3a21b)",
      step: "Source",
    },
    { id: "3", timestamp: "10:55:15", level: "info", message: "Installing dependencies...", step: "Build" },
    { id: "4", timestamp: "10:56:45", level: "success", message: "Dependencies installed and optimized.", step: "Build" },
    { id: "5", timestamp: "10:56:46", level: "info", message: "Running unit and integration tests...", step: "Tests" },
    { id: "6", timestamp: "10:58:50", level: "success", message: "All tests passed (142/142).", step: "Tests" },
    { id: "7", timestamp: "10:58:51", level: "info", message: "Building Docker image: deployzilla-dashboard:latest", step: "Docker" },
  ]);

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
      timestamp: "2026-01-04 18:30",
    },
  ];

  const handleDeploy = () => {
    setIsDeploying(true);
    // Simulation logic could go here
    setTimeout(() => setIsDeploying(false), 5000);
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-10 bg-zinc-950/20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
            <Zap className="w-8 h-8 text-accent fill-accent" />
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Real-time CI/CD pipeline and deployment status</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground border-l border-zinc-800 pl-4 h-10">
          <span>
            Active Commit: <span className="text-accent underline">7f3a21b</span>
          </span>
          <span className="text-zinc-800">|</span>
          <span>
            Branch: <span className="text-accent underline">main</span>
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pipeline & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Active Pipeline</h2>
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
              <h2 className="text-sm font-bold uppercase tracking-widest">Deployment Controls</h2>
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
            <Card className="bg-background/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-mono text-green-500">99.98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Response Time</span>
                  <span className="text-sm font-mono text-accent">142ms</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
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
