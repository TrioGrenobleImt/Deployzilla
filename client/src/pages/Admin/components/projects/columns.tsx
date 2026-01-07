import { ColumnDef } from "@tanstack/react-table";
import { ProjectInterface } from "@/interfaces/Project";
import { TFunction } from "i18next";
import { MoreHorizontal, Copy, Edit, Trash, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const getColumns = (callback: (action: string, data: any) => void, t: TFunction): ColumnDef<ProjectInterface>[] => [
  {
    accessorKey: "name",
    header: t("pages.admin.projects_page.form.name"),
    cell: ({ row }) => <div className="font-bold">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "repoUrl",
    header: t("pages.admin.projects_page.form.repositoryUrl"),
    cell: ({ row }) => <div className="max-w-[200px] truncate text-muted-foreground font-mono text-xs">{row.getValue("repoUrl")}</div>,
  },
  {
    accessorKey: "branch",
    header: t("pages.admin.projects_page.form.branch"),
    cell: ({ row }) => <Badge variant="secondary">{row.getValue("branch")}</Badge>,
  },
  {
    accessorKey: "isPrivate",
    header: t("pages.admin.projects_page.form.visibility"),
    cell: ({ row }) => (
      <Badge
        variant={row.getValue("isPrivate") ? "destructive" : "outline"}
        className={
          row.getValue("isPrivate") ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
        }
      >
        {row.getValue("isPrivate") ? t("pages.admin.projects_page.status.private") : t("pages.admin.projects_page.status.public")}
      </Badge>
    ),
  },
  {
    accessorKey: "autoDeploy",
    header: t("pages.admin.projects_page.form.autoDeploy"),
    cell: ({ row }) => (
      <Badge
        variant={row.getValue("autoDeploy") ? "outline" : "secondary"}
        className={row.getValue("autoDeploy") ? "text-green-500 border-green-500/50" : ""}
      >
        {row.getValue("autoDeploy") ? t("pages.admin.projects_page.status.active") : t("pages.admin.projects_page.status.inactive")}
      </Badge>
    ),
  },
  {
    accessorKey: "webhookUrl",
    header: t("pages.admin.projects_page.webhook_url"),
    cell: ({ row }) => {
      const webhookUrl = `${import.meta.env.VITE_API_URL}/api/webhooks/github`;
      return (
        <div className="flex items-center gap-2">
          <div className="max-w-[150px] truncate text-muted-foreground font-mono text-xs">{webhookUrl}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              navigator.clipboard.writeText(webhookUrl);
              toast.success(t("pages.admin.projects_page.copy_webhook_success"));
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("pages.admin.projects_page.actions")}</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(project._id);
                toast.success(t("pages.admin.projects_page.copy_id_success"));
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("pages.admin.projects_page.copy_id")}
            </DropdownMenuItem>
            {project.isPrivate && (
              <DropdownMenuItem
                onClick={() => {
                  if (project.publicKey) {
                    navigator.clipboard.writeText(project.publicKey);
                    toast.success(t("pages.admin.projects_page.copy_public_key_success"));
                  }
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                {t("pages.admin.projects_page.copy_public_key")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => callback("env-vars", project._id)}>
              <Edit className="mr-2 h-4 w-4" />
              {t("pages.admin.projects_page.manage_env_vars")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => callback("manage-users", project._id)}>
              <Users className="mr-2 h-4 w-4" />
              {t("pages.admin.projects_page.manage_users")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => callback("update", project._id)}>
              <Edit className="mr-2 h-4 w-4" />
              {t("pages.admin.projects_page.update_project")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => callback("delete", project._id)} className="text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              {t("pages.admin.projects_page.delete_project")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
