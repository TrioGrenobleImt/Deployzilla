import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExternalLink, GitBranch, User, History as LuHistory, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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
}

const statusBadge = {
  success: "bg-green-500/10 text-green-500 border-green-500/50 hover:bg-green-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/50 hover:bg-destructive/20",
  rolled_back: "bg-yellow-500/10 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/20",
};

export const DeploymentHistory = ({ history }: DeploymentHistoryProps) => {
  const { t } = useTranslation();

  return (
    <Card className="bg-background/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <LuHistory className="w-5 h-5" />
          {t("pages.home.history.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
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
            {history.map((record) => (
              <TableRow key={record.id} className="cursor-pointer group hover:bg-accent/5 border-border/50">
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-1 text-accent">
                    <GitBranch className="w-3 h-3" />
                    {record.commitHash}
                  </div>
                </TableCell>
                <TableCell className="capitalize text-xs text-muted-foreground">{record.trigger}</TableCell>
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
                    {record.deployedBy}
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{record.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
