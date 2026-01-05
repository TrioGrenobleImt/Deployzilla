import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
  step?: string;
}

interface PipelineLogsProps {
  logs: LogEntry[];
}

import { useTranslation } from "react-i18next";

export const PipelineLogs = ({ logs }: PipelineLogsProps) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [logs]);

  const filteredLogs = logs.filter(
    (log) => log.message.toLowerCase().includes(filter.toLowerCase()) || log.step?.toLowerCase().includes(filter.toLowerCase()),
  );

  const levelColors = {
    info: "text-blue-500",
    success: "text-green-500",
    warn: "text-yellow-500",
    error: "text-red-500",
  };

  return (
    <Card className="flex flex-col h-[400px] bg-transparent border-none font-mono shadow-none">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">
            {t("pages.home.pipeline.logs.title")}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("pages.home.pipeline.logs.filter_placeholder")}
              className="h-8 w-64 bg-muted/50 border border-border/50 rounded-lg pl-8 pr-3 text-[10px] font-black uppercase tracking-widest text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-full w-full overflow-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-border" ref={scrollRef}>
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-4 text-[10px] py-1 px-2 rounded group hover:bg-muted/50 transition-colors">
              <span className="text-muted-foreground/50 shrink-0 w-20 font-mono">{log.timestamp}</span>
              {log.step && (
                <span className="text-muted-foreground font-black shrink-0 w-24 uppercase truncate">
                  [{t(`pages.home.pipeline.stages.${log.step.toLowerCase()}`)}]
                </span>
              )}
              <span className={cn("shrink-0 uppercase w-12 font-black", levelColors[log.level])}>{log.level}</span>
              <span className="text-foreground/90 whitespace-pre-wrap flex-1">{log.message}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/40 italic text-xs uppercase tracking-widest font-black">
              {t("pages.home.pipeline.logs.no_logs")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
