export interface ProjectInterface {
  _id: string;
  name: string;
  repoUrl: string;
  branch: string;
  autoDeploy: boolean;
  envVars?: { key: string; value: string }[];
  allowedUsers?: string[];
  createdAt?: string;
  updatedAt?: string;
}
