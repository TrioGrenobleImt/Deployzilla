import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExternalLink, GitBranch, User, History as LuHistory, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export interface DeploymentRecord {
  id: string;
  commitHash: string;
  trigger: "manual" | "github";
  environment: string;
  status: "success" | "failed" | "rolled_back";
  duration: string;
  deployedBy: string;
  timestamp: string;
}

interface DeploymentHistoryProps {
  history: DeploymentRecord[];
  repoUrl?: string;
}

const statusBadge = {
  success: "bg-green-500/10 text-green-500 border-green-500/50 hover:bg-green-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/50 hover:bg-destructive/20",
  rolled_back: "bg-yellow-500/10 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/20",
};

const ITEMS_PER_PAGE = 10;

export const DeploymentHistory = ({ history, repoUrl }: DeploymentHistoryProps) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = history.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="flex flex-col h-full">
      <CardContent className="p-4 pt-3 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50 font-black">
              <TableHead className="w-[100px]">{t("pages.home.history.columns.commit")}</TableHead>
              <TableHead>{t("pages.home.history.columns.trigger")}</TableHead>
              <TableHead>{t("pages.home.history.columns.environment")}</TableHead>
              <TableHead>{t("pages.home.history.columns.status")}</TableHead>
              <TableHead>{t("pages.home.history.columns.duration")}</TableHead>
              <TableHead>{t("pages.home.history.columns.by")}</TableHead>
              <TableHead className="text-right">{t("pages.home.history.columns.date")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((record) => (
              <TableRow key={record.id} className="cursor-pointer group hover:bg-accent/5 border-border/50">
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-1 text-accent">
                    <GitBranch className="w-3 h-3" />
                    {repoUrl && record.trigger === "github" && record.commitHash !== "---" ? (
                      <a
                        href={`${repoUrl
                          .replace(/\.git$/, "")
                          .replace(/^git@([^:]+):/, "https://$1/")
                          .replace(/^ssh:\/\/git@([^/]+)\//, "https://$1/")}/commit/${record.commitHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline decoration-accent/30 underline-offset-4"
                      >
                        {record.commitHash.substring(0, 7)}
                      </a>
                    ) : (
                      record.commitHash.substring(0, 7)
                    )}
                  </div>
                </TableCell>
                <TableCell className="capitalize text-xs text-muted-foreground">{t(`pages.project.triggers.${record.trigger}`)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] h-5 uppercase tracking-tighter">
                    {t(`navbar.environments.${record.environment}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-[10px] h-5 capitalize", statusBadge[record.status])}>
                    {t(`pages.home.history.statuses.${record.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {record.duration}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-muted-foreground" />
                    {record.trigger === "github" && record.deployedBy !== "System" ? (
                      <a
                        href={`https://github.com/${record.deployedBy}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline decoration-accent/30 underline-offset-4"
                      >
                        {record.deployedBy}
                      </a>
                    ) : (
                      record.deployedBy
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{record.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/20">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
            {t("pages.home.history.pagination.page", {
              start: startIndex + 1,
              end: Math.min(startIndex + ITEMS_PER_PAGE, history.length),
              totalCount: history.length,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-background/50 hover:bg-accent hover:text-white transition-all border-border/50"
            >
              <ChevronLeft className="w-3 h-3 mr-1" />
              {t("pages.home.history.pagination.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-background/50 hover:bg-accent hover:text-white transition-all border-border/50"
            >
              {t("pages.home.history.pagination.next")}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
