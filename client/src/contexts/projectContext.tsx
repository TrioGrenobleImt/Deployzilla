import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { axiosConfig } from "@/config/axiosConfig";
import { ProjectInterface } from "@/interfaces/Project";
import { useAuthContext } from "./authContext";

interface ProjectContextType {
  projects: ProjectInterface[];
  selectedProject: ProjectInterface | null;
  setSelectedProject: (project: ProjectInterface | null) => void;
  loading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authUser } = useAuthContext();
  const [projects, setProjects] = useState<ProjectInterface[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectInterface | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    if (!authUser) return;
    try {
      const response = await axiosConfig.get("/projects");
      setProjects(response.data);

      // Try to restore selection from localStorage or default to first project
      const savedProjectId = localStorage.getItem("selectedProjectId");
      if (response.data.length > 0) {
        const found = response.data.find((p: ProjectInterface) => p._id === savedProjectId);
        if (found) {
          setSelectedProject(found);
        } else {
          setSelectedProject(null);
        }
      } else {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const handleSetSelectedProject = (project: ProjectInterface | null) => {
    setSelectedProject(project);
    if (project) {
      localStorage.setItem("selectedProjectId", project._id);
    } else {
      localStorage.removeItem("selectedProjectId");
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProject,
        setSelectedProject: handleSetSelectedProject,
        loading,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};
