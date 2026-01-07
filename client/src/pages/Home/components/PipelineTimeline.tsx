import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, Loader2, PlayCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type StageStatus = "pending" | "running" | "success" | "failed";

export interface PipelineStage {
  id: string;
  name: string;
  status: StageStatus;
  duration?: string;
  icon: any;
}

interface PipelineTimelineProps {
  stages: PipelineStage[];
  orientation?: "horizontal" | "vertical";
}

const statusConfig = {
  pending: {
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-muted",
    animate: "",
  },
  running: {
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/50",
    animate: "animate-spin",
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/50",
    animate: "",
  },
  failed: {
    icon: RotateCcw,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/50",
    animate: "",
  },
};

import { useTranslation } from "react-i18next";

export const PipelineTimeline = ({ stages, orientation = "horizontal" }: PipelineTimelineProps) => {
  const { t } = useTranslation();
  const isVertical = orientation === "vertical";

  return (
    <div className={cn("w-full", isVertical ? "h-full" : "py-4")}>
      <div className={cn("relative flex w-full", isVertical ? "flex-col justify-between h-full" : "justify-between items-start")}>
        {/* Progress Line Background */}
        {isVertical ? (
          <div className="absolute left-[27px] top-8 w-0.5 h-[calc(100%-48px)] bg-border z-0" />
        ) : (
          <div className="absolute top-9 left-0 w-full h-0.5 bg-border z-0" />
        )}

        {stages.map((stage) => {
          const Config = statusConfig[stage.status];
          const Icon = Config.icon;

          return (
            <div
              key={stage.id}
              className={cn("relative z-10 flex", isVertical ? "flex-row items-center gap-4" : "flex-col items-center px-2 flex-1 pt-2")}
            >
              {/* Icon Container */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 bg-background transition-all duration-300 shadow-sm shrink-0",
                  isVertical ? "w-14 h-14" : "w-14 h-14",
                  Config.bg,
                  Config.border,
                  stage.status === "running" && "ring-4 ring-blue-500/20",
                )}
              >
                <Icon className={cn("w-7 h-7", Config.color, Config.animate)} />
              </div>

              {/* Label & Details */}
              <div className={cn("flex flex-col", isVertical ? "items-start" : "mt-5 items-center text-center max-w-[140px]")}>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground line-clamp-1">
                  {t(`pages.home.pipeline.stages.${stage.name.toLowerCase().replace(/\s+/g, "_")}`)}
                </span>
                {stage.duration && (
                  <span className="flex items-center gap-1 mt-1 text-[9px] md:text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
                    <Clock className="w-2.5 h-2.5" />
                    {stage.duration}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
