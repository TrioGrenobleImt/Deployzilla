import { Button } from "@/components/ui/button";
import { Play, RotateCcw, History, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DeploymentControlsProps {
  onDeploy: () => void;
  onRedeploy: () => void;
  onRollback: () => void;
  canDeploy: boolean;
  isDeploying: boolean;
}

export const DeploymentControls = ({ onDeploy, onRedeploy, onRollback, canDeploy, isDeploying }: DeploymentControlsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Button
        size="lg"
        onClick={onDeploy}
        disabled={!canDeploy || isDeploying}
        className={cn(
          "w-full h-14 text-lg font-bold shadow-lg transition-all active:scale-95",
          canDeploy ? "bg-accent hover:bg-accent/90" : "bg-muted",
        )}
      >
        <Play className={cn("mr-2 h-5 w-5", isDeploying && "animate-pulse")} />
        {isDeploying ? "Deploying..." : "Run Pipeline"}
      </Button>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={onRedeploy}
          disabled={isDeploying}
          className="h-12 border-border/50 hover:bg-accent/10 hover:text-accent transition-colors"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Redeploy
        </Button>
        <Button
          variant="outline"
          onClick={onRollback}
          disabled={isDeploying}
          className="h-12 border-border/50 hover:bg-destructive/10 hover:text-destructive transition-colors group"
        >
          <History className="mr-2 h-4 w-4 group-hover:rotate-[-45deg] transition-transform" />
          Rollback
        </Button>
      </div>

      {!canDeploy && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          You don't have permission to deploy to this environment.
        </div>
      )}
    </div>
  );
};
