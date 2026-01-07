import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { axiosConfig } from "@/config/axiosConfig";
import { toast } from "sonner";
import { ProjectInterface } from "@/interfaces/Project";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation, Trans } from "react-i18next";
import { Trash } from "lucide-react";

interface ProjectFormProps {
  dialog: (open: boolean) => void;
  refresh: () => void;
  action: string;
  project?: ProjectInterface;
}

export const ProjectForm = ({ dialog, refresh, action, project }: ProjectFormProps) => {
  const { t } = useTranslation();

  const formSchema = z.object({
    name: z.string().min(2).max(50),
    repoUrl: z.string().url(),
    branch: z.string().min(1).optional(),
    autoDeploy: z.boolean().optional(),
    isPrivate: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name || "",
      repoUrl: project?.repoUrl || "",
      branch: project?.branch || "main",
      autoDeploy: project?.autoDeploy ?? true,
      isPrivate: project?.isPrivate ?? false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const payload = values;

    try {
      if (action === "create") {
        await axiosConfig.post("/projects", payload);
        toast.success(t("server.projects.messages.created"));
      } else if (action === "update") {
        await axiosConfig.patch(`/projects/${project?._id}`, payload);
        toast.success(t("server.projects.messages.updated"));
      }
      refresh();
      dialog(false);
    } catch (error: any) {
      toast.error(t(error.response?.data?.error || "Error saving project"));
    }
  }

  async function onDelete() {
    try {
      await axiosConfig.delete(`/projects/${project?._id}`);
      toast.success(t("server.projects.messages.deleted"));
      refresh();
      dialog(false);
    } catch (error: any) {
      toast.error(t(error.response?.data?.error || "Error deleting project"));
    }
  }

  if (action === "delete") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          <Trans
            i18nKey="pages.admin.projects_page.delete_description"
            values={{ name: project?.name }}
            components={{ strong: <strong /> }}
          />
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => dialog(false)}>
            {t("global.buttons.cancel")}
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash className="mr-2 h-4 w-4" />
            {t("global.buttons.delete")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pages.admin.projects_page.form.name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("pages.admin.projects_page.form.name_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="repoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pages.admin.projects_page.form.repositoryUrlEdit")}</FormLabel>
              <FormControl>
                <Input placeholder="https://github.com/user/repo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="branch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pages.admin.projects_page.form.branch")}</FormLabel>
              <FormControl>
                <Input placeholder={t("pages.admin.projects_page.form.branch_placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="py-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t("pages.admin.projects_page.admin")} Settings
            </span>
            <div className="h-px bg-border flex-1" />
          </div>
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="autoDeploy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 border-border/50 transition-all hover:bg-muted/30">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">{t("pages.admin.projects_page.form.autoDeploy")}</FormLabel>
                    <FormDescription className="text-xs">{t("pages.admin.projects_page.form.autoDeploy_description")}</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 border-border/50 transition-all hover:bg-muted/30">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">{t("pages.admin.projects_page.form.isPrivate")}</FormLabel>
                    <FormDescription className="text-xs">{t("pages.admin.projects_page.form.isPrivate_description")}</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" className="w-[120px]">
            {action === "create" ? t("global.buttons.save") : t("global.buttons.update")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
