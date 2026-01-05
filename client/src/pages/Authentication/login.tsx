import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getLoginSchema } from "@/lib/zod/schemas/auth/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuthContext } from "@/contexts/authContext";
import { axiosConfig } from "@/config/axiosConfig";
import { toast } from "sonner";
import { useConfigContext } from "@/contexts/configContext";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { OAuth } from "@/components/customs/oauth";
import { Zap, Activity } from "lucide-react";

export const Login = () => {
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAuthUser } = useAuthContext();

  const loginSchema = getLoginSchema(t);
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginName: "",
      password: "",
    },
  });

  async function login(values: z.infer<typeof loginSchema>) {
    try {
      setLoading(true);

      const isEmail = /\S+@\S+\.\S+/.test(values.loginName);
      const payload = {
        password: values.password,
        ...(isEmail ? { email: values.loginName } : { username: values.loginName }),
      };
      const response = await axiosConfig.post("/auth/login", payload);

      toast.success(t(response.data.message));
      setAuthUser(response.data.user);
      localStorage.setItem("accessToken", response.data.accessToken);
      navigate("/");
    } catch (error: any) {
      toast.error(t(error.response.data.error));
    } finally {
      setLoading(false);
    }
  }

  const { getConfigValue } = useConfigContext();
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfigValues = async () => {
      const values = await getConfigValue(["APP_NAME"]);
      setConfigValues(values);
    };

    fetchConfigValues();
  }, [getConfigValue]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-svh p-6 md:p-10 overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-pulse delay-700" />
      <div className="absolute top-[20%] right-[10%] w-32 h-32 border border-accent/10 rounded-full animate-spin-slow" />
      <div className="absolute bottom-[20%] left-[10%] w-24 h-24 border border-accent/20 rounded-full animate-bounce-slow" />

      <div className="relative flex flex-col items-center gap-8 w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-accent rounded-2xl shadow-2xl shadow-accent/20">
            <Zap className="w-8 h-8 text-accent-foreground fill-accent-foreground" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mt-4">{configValues["APP_NAME"]}</h1>
        </div>

        <div className="w-full flex flex-col gap-8 bg-background/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-black/10">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("pages.login.welcome_back")}</h2>
            <p className="text-sm text-muted-foreground font-medium">{t("pages.login.field_description")}</p>
          </div>

          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(login)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="loginName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        {t("pages.login.field")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="johndoe"
                          className="h-12 bg-zinc-100/50 dark:bg-zinc-800/50 border-transparent focus:border-accent/40 rounded-xl transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        {t("pages.login.password")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-12 bg-zinc-100/50 dark:bg-zinc-800/50 border-transparent focus:border-accent/40 rounded-xl transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-accent text-accent-foreground font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                disabled={loading}
              >
                {loading ? <Activity className="w-5 h-5 animate-spin" /> : t("pages.login.login_button")}
              </Button>

              {import.meta.env.VITE_FIREBASE_API_KEY && (
                <div className="space-y-6">
                  <div className="relative h-px bg-border">
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-background/0 backdrop-blur-none text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("pages.login.or_continue_with")}
                    </span>
                  </div>
                  <OAuth message="pages.login.login_button" />
                </div>
              )}
            </form>
          </Form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">
              {t("pages.login.no_account")}{" "}
              <Link to="/register" className="text-foreground font-bold hover:underline underline-offset-4 decoration-accent decoration-2">
                {t("pages.login.sign_up")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
