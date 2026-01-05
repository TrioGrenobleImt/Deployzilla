export interface ProjectInterface {
  _id: string;
  name: string;
  repoUrl: string;
  branch: string;
  autoDeploy: boolean;
  createdAt?: string;
  updatedAt?: string;
}
