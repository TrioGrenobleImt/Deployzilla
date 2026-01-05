import { axiosConfig } from "@/config/axiosConfig";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getColumns } from "./columns";
import { Dialog, DialogHeader, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProjectForm } from "./projectForm";
import { ProjectInterface } from "@/interfaces/Project";
import { DataTable } from "@/components/customs/dataTable";
import { useTranslation } from "react-i18next";
import { useProjectContext } from "@/contexts/projectContext";

export const Projects = () => {
  const { projects, refreshProjects, loading: contextLoading } = useProjectContext();
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [action, setAction] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectInterface>();

  const { t } = useTranslation();

  async function fetchProjects() {
    setLoading(true);
    try {
      await refreshProjects();
    } catch (error: any) {
      toast.error(t(error.response?.data?.error || "Error fetching projects"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  function callback(action: string, data: any) {
    setSelectedProject(undefined);
    switch (action) {
      case "create":
        setAction("create");
        setOpenDialog(true);
        break;
      case "update":
        setSelectedProject(projects.find((p) => p._id === data));
        setAction("update");
        setOpenDialog(true);
        break;
      case "delete":
        // Delete handled by form/confirmation in this app usually
        setSelectedProject(projects.find((p) => p._id === data));
        setAction("delete");
        setOpenDialog(true);
        break;
      default:
        break;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 p-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("pages.admin.projects_page.title")}</h1>
        <p className="text-muted-foreground">{t("pages.admin.projects_page.description")}</p>
      </div>

      <div className="container px-4 mx-auto">
        <DataTable
          columns={getColumns(callback, t)}
          data={projects}
          dataCount={projects.length}
          fetchData={fetchProjects}
          isLoading={loading || contextLoading}
          callback={callback}
          searchElement="name"
          actions={["create"]}
        />
      </div>

      {openDialog && (
        <Dialog open={openDialog} onOpenChange={() => setOpenDialog(false)}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>
                {t(`pages.admin.projects_page.actions_type.` + action)} {t("pages.admin.projects_page.a_project")}
              </DialogTitle>
            </DialogHeader>
            <ProjectForm dialog={setOpenDialog} refresh={fetchProjects} action={action} project={selectedProject} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
