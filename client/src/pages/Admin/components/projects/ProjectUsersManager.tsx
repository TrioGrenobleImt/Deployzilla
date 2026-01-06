import { useState, useEffect } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectInterface } from "@/interfaces/Project";
import { axiosConfig } from "@/config/axiosConfig";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ProjectUsersManagerProps {
  project: ProjectInterface;
  onUpdate: () => void;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

export const ProjectUsersManager = ({ project, onUpdate }: ProjectUsersManagerProps) => {
  const { t } = useTranslation();
  const [currentAllowedUsers, setCurrentAllowedUsers] = useState<string[]>(
    project.allowedUsers ? project.allowedUsers.map((u: any) => u._id || u) : []
  );
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosConfig.get("/users");
        setAllUsers(response.data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      }
    };
    fetchUsers();
  }, []);

  const handleAdd = () => {
    if (!selectedUserId) return;
    if (currentAllowedUsers.includes(selectedUserId)) {
      toast.error("User already allowed");
      return;
    }
    setCurrentAllowedUsers([...currentAllowedUsers, selectedUserId]);
    setSelectedUserId("");
  };

  const handleRemove = (userId: string) => {
    setCurrentAllowedUsers(currentAllowedUsers.filter((id) => id !== userId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axiosConfig.patch(`/projects/${project._id}`, {
        allowedUsers: currentAllowedUsers,
      });
      toast.success(t("Project users updated successfully"));
      onUpdate();
    } catch (error) {
      console.error("Error updating project users:", error);
      toast.error(t("Failed to update project users"));
    } finally {
      setIsSaving(false);
    }
  };

  const getUsername = (userId: string) => {
    const user = allUsers.find((u) => u._id === userId);
    return user ? user.username : "Unknown User";
  };
  
  const getEmail = (userId: string) => {
      const user = allUsers.find((u) => u._id === userId);
      return user ? user.email : "";
  };

  // Filter out users already added to show in select
  const availableUsers = allUsers.filter(
    (user) => !currentAllowedUsers.includes(user._id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a user to add" />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {user.username} ({user.email})
              </SelectItem>
            ))}
            {availableUsers.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground text-center">No more users available</div>
            )}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={!selectedUserId}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentAllowedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No allowed users defined (Project might be public or admin-only depending on logic)
                </TableCell>
              </TableRow>
            ) : (
              currentAllowedUsers.map((userId) => (
                <TableRow key={userId}>
                  <TableCell className="font-medium">{getUsername(userId)}</TableCell>
                   <TableCell className="text-muted-foreground">{getEmail(userId)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemove(userId)}
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
          {t("global.buttons.save")}
        </Button>
      </div>
    </div>
  );
};
