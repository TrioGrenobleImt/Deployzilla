import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeploymentRecord } from "./DeploymentHistory";
import { Button } from "@/components/ui/button";
import { History, GitCommit, User, Calendar, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RollbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (commitHash: string) => void;
  history: DeploymentRecord[];
}

export const RollbackDialog = ({ isOpen, onClose, onConfirm, history }: RollbackDialogProps) => {
  const { t } = useTranslation();
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  // Group successful deployments by commit hash
  const groupedDeployments = useMemo(() => {
    const successful = history.filter((record) => record.status === "success");
    const groups = new Map<string, DeploymentRecord[]>();

    successful.forEach((record) => {
      const existing = groups.get(record.commitHash) || [];
      groups.set(record.commitHash, [...existing, record]);
    });

    // Convert to array and sort by most recent deployment in the group
    return Array.from(groups.entries())
      .map(([commitHash, records]) => {
        // Sort records within group by date desc (though history is likely already sorted)
        const sortedRecords = records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return {
          commitHash,
          latestRecord: sortedRecords[0],
          count: records.length,
          records: sortedRecords,
        };
      })
      .sort((a, b) => new Date(b.latestRecord.timestamp).getTime() - new Date(a.latestRecord.timestamp).getTime());
  }, [history]);

  const handleConfirm = () => {
    if (selectedCommit) {
      onConfirm(selectedCommit);
      onClose();
    }
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleClose = () => {
    setVisibleCount(10); // Reset on close
    setSelectedCommit(null);
    onClose();
  };

  const visibleGroups = groupedDeployments.slice(0, visibleCount);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        <div className="p-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <History className="w-5 h-5 text-destructive" />
              </div>
              {t("pages.home.controls.rollback_title", "Rollback to version")}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t(
                "pages.home.controls.rollback_desc",
                "Select a previous successful deployment to restore. This will trigger a new deployment using the selected commit.",
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="space-y-3">
            {groupedDeployments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="p-4 bg-muted rounded-full">
                  <History className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">
                    {t("pages.home.controls.no_history", "No successful deployments found in history.")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {visibleGroups.map(({ commitHash, latestRecord, count }) => (
                  <div
                    key={commitHash}
                    onClick={() => setSelectedCommit(commitHash)}
                    className={cn(
                      "group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                      selectedCommit === commitHash
                        ? "border-destructive/50 bg-destructive/5 ring-1 ring-destructive/20 shadow-sm"
                        : "border-border/50 hover:bg-muted/50 hover:border-border hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg border",
                            selectedCommit === commitHash ? "bg-background border-destructive/20" : "bg-background/50 border-border/30",
                          )}
                        >
                          <GitCommit className="w-5 h-5 text-accent" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg tracking-tight">{commitHash.substring(0, 7)}</span>
                            {count > 1 && (
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                {count} {count === 1 ? "deploy" : "deploys"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              <span>{latestRecord.deployedBy}</span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              <span>{latestRecord.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="outline"
                          className="uppercase text-[10px] tracking-wider font-bold bg-green-500/10 text-green-600 border-green-500/20"
                        >
                          Success
                        </Badge>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-bold bg-background/50">
                          {latestRecord.environment}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {visibleCount < groupedDeployments.length && (
                  <Button
                    variant="ghost"
                    onClick={loadMore}
                    className="w-full text-muted-foreground hover:text-foreground text-xs uppercase tracking-widest font-black h-12"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load more versions
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-border/50 bg-muted/5 flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} className="hover:bg-muted font-medium">
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedCommit}
            className="gap-2 px-6 shadow-lg shadow-destructive/20"
          >
            <History className="w-4 h-4" />
            {t("pages.home.controls.confirm_rollback", "Rollback")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
