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
    info: "text-blue-400",
    success: "text-green-400",
    warn: "text-yellow-400",
    error: "text-red-400",
  };

  return (
    <Card className="flex flex-col h-[400px] bg-zinc-950 border-zinc-800 font-mono shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <CardTitle className="text-sm font-medium text-zinc-200">{t("pages.home.pipeline.logs.title")}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-zinc-500" />
            <input
              type="text"
              placeholder={t("pages.home.pipeline.logs.filter_placeholder")}
              className="h-8 w-64 bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-accent"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-full w-full overflow-auto p-4 space-y-1" ref={scrollRef}>
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-4 text-xs group hover:bg-zinc-900/50 transition-colors">
              <span className="text-zinc-600 shrink-0 w-20">{log.timestamp}</span>
              {log.step && (
                <span className="text-zinc-500 font-bold shrink-0 w-24 uppercase truncate">
                  [{t(`pages.home.pipeline.stages.${log.step.toLowerCase()}`)}]
                </span>
              )}
              <span className={cn("shrink-0 uppercase w-12 font-bold", levelColors[log.level])}>{log.level}</span>
              <span className="text-zinc-300 whitespace-pre-wrap">{log.message}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-600 italic">
              {t("pages.home.pipeline.logs.no_logs")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
