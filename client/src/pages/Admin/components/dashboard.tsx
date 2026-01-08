import { Loading } from "@/components/customs/loading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { axiosConfig } from "@/config/axiosConfig";
import { useSocketContext } from "@/contexts/socketContext";
import { Activity, LogIn, Users, Server, CheckCircle, List, Trophy, Zap, Calendar, AlertTriangle, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [projectStats, setProjectStats] = useState<{
    totalProjects: number;
    totalPipelines: number;
    pipelinesThisWeek: number;
    successRate: number;
    mostActiveProject: string;
    topAuthor: string;
    pipelinesToday: number;
    failedPipelines: number;
    activeProjects: number;
  } | null>(null);
  const [authTypes, setAuthType] = useState<{ label: string; value: number }[]>();
  const { onlineUsers } = useSocketContext();
  const { t } = useTranslation();

  useEffect(() => {
    fetchUsers();
    fetchAuthStats();
    fetchProjectStats();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const response = await axiosConfig.get("/users");
      setUserCount(response.data.count);
    } catch (error: any) {
      toast.error(t(error.response?.data?.error || "Error fetching users"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuthStats() {
    try {
      const response = await axiosConfig.get("/users/stats/authTypes");
      setAuthType(response.data.data);
    } catch (error: any) {
      toast.error(t(error.response?.data?.error || "Error fetching auth stats"));
    }
  }

  async function fetchProjectStats() {
    try {
      const response = await axiosConfig.get("/projects/stats");
      setProjectStats(response.data);
    } catch (error: any) {
      toast.error(t(error.response?.data?.error || "Error fetching project stats"));
    }
  }

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="flex flex-col px-4 space-y-8 md:px-8 py-6">
          {/* Project Stats Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">{t("pages.home.system_health.title")}</h2>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("pages.admin.projects")}</CardTitle>
                  <Server className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectStats?.totalProjects || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("pages.home.system_health.active_projects")}</CardTitle>
                  <Play className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectStats?.activeProjects || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("pages.home.system_health.total_deployments")}</CardTitle>
                  <List className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectStats?.totalPipelines || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{projectStats?.pipelinesThisWeek || 0} {t("pages.home.system_health.deployments_this_week")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("pages.home.system_health.deployments_today")}</CardTitle>
                  <Calendar className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectStats?.pipelinesToday || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("pages.home.system_health.success_rate")}</CardTitle>
                  <CheckCircle className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectStats?.successRate ? projectStats.successRate.toFixed(1) : 0}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("pages.home.system_health.failed_deployments")}</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectStats?.failedPipelines || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("pages.home.system_health.most_active_project")}</CardTitle>
                  <Zap className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold truncate" title={projectStats?.mostActiveProject || "N/A"}>
                    {projectStats?.mostActiveProject || "N/A"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("pages.home.system_health.top_deployer")}</CardTitle>
                  <Trophy className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold truncate" title={projectStats?.topAuthor || "N/A"}>
                    {projectStats?.topAuthor || "N/A"}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* User Stats Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">{t("pages.admin.users_page.user")}s</h2>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="col-span-4 lg:col-span-3 grid gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{t("pages.admin.dashboard_page.active_users")}</CardTitle>
                    <Activity className="w-4 h-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+ {onlineUsers.length}</div>
                    <p className="text-xs text-muted-foreground">{t("pages.admin.dashboard_page.active_users_desc")}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{t("pages.admin.dashboard_page.total_users")}</CardTitle>
                    <Users className="w-4 h-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+ {userCount}</div>
                    <p className="text-xs text-muted-foreground">{t("pages.admin.dashboard_page.registered_users_count")}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="col-span-4">
                <CardHeader>
                  <div className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>{t("pages.admin.dashboard_page.auth_methods")}</CardTitle>
                    <LogIn className="w-4 h-4 text-accent" />
                  </div>
                  <CardDescription>{t("pages.admin.dashboard_page.auth_methods_description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...(authTypes ?? [])]
                      .sort((a, b) => b.value - a.value)
                      .map((item, index) => {
                        const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500"];
                        const color = colors[index % colors.length];

                        return (
                          <div key={item.label} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`w-4 h-4 rounded-full ${color}`} />
                              <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {Math.round((item.value / userCount) * 100)}% {t("pages.admin.dashboard_page.of_users")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{item.value}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      )}
    </>
  );
};
