import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectInterface } from "@/interfaces/Project";
import { axiosConfig } from "@/config/axiosConfig";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface EnvVarsManagerProps {
  project: ProjectInterface;
  onUpdate: () => void;
}

export const EnvVarsManager = ({ project, onUpdate }: EnvVarsManagerProps) => {
  const { t } = useTranslation();
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>(
    project.envVars || []
  );
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = () => {
    if (!newKey || !newValue) {
      toast.error(t("Please enter both key and value"));
      return;
    }
    if (envVars.some((v) => v.key === newKey)) {
      toast.error(t("Key already exists"));
      return;
    }
    setEnvVars([...envVars, { key: newKey, value: newValue }]);
    setNewKey("");
    setNewValue("");
  };

  const handleDelete = (key: string) => {
    setEnvVars(envVars.filter((v) => v.key !== key));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axiosConfig.patch(`/projects/${project._id}`, {
        envVars,
      });
      toast.success(t("Environment variables updated successfully"));
      onUpdate();
    } catch (error) {
      console.error("Error updating env vars:", error);
      toast.error(t("Failed to update environment variables"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="grid gap-1.5 flex-1">
          <Input
            placeholder="KEY"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value.toUpperCase())}
            className="font-mono uppercase"
          />
        </div>
        <div className="grid gap-1.5 flex-1">
          <Input
            placeholder="VALUE"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="font-mono"
          />
        </div>
        <Button onClick={handleAdd} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {envVars.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No environment variables defined
                </TableCell>
              </TableRow>
            ) : (
              envVars.map((env) => (
                <TableRow key={env.key}>
                  <TableCell className="font-mono font-medium">{env.key}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {env.value}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(env.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t("Save Changes")}
        </Button>
      </div>
    </div>
  );
};
