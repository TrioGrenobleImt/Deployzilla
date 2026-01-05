import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRegisterSchema } from "@/lib/zod/schemas/auth/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { OAuth } from "./oauth";
import { useConfigContext } from "@/contexts/configContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Activity } from "lucide-react";

type RegisterFormProps = {
  onSubmit: (values: z.infer<any>) => Promise<void>;
  defaultValues?: Partial<z.infer<any>>;
  disabledFields?: string[];
  submitLabel?: string;
  loading?: boolean;
  oauth?: boolean;
};

export const RegisterForm = ({
  onSubmit,
  defaultValues = {},
  disabledFields = [],
  submitLabel,
  loading = false,
  oauth = false,
}: RegisterFormProps) => {
  const { t } = useTranslation();
  const registerSchema = getRegisterSchema(t);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      forename: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      ...defaultValues,
    },
  });

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
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-pulse delay-700" />
      <div className="absolute top-[10%] left-[5%] w-32 h-32 border border-accent/10 rounded-full animate-spin-slow" />

      <div className="relative flex flex-col items-center gap-8 w-full max-w-2xl z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 bg-accent rounded-2xl shadow-2xl shadow-accent/20">
            <Zap className="w-8 h-8 text-accent-foreground fill-accent-foreground" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground mt-4">{configValues["APP_NAME"]}</h1>
        </div>

        <div className="w-full flex flex-col gap-8 bg-background/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-black/10">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {oauth ? t("pages.register.title") : t("pages.register.password_creation")}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">Join the most advanced deployment experience.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["forename", "name"].map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                          {t(`pages.register.${fieldName}`)}
                        </FormLabel>
                        <FormControl>
                          <Input
                            disabled={disabledFields.includes(fieldName)}
                            className="h-11 bg-zinc-100/50 dark:bg-zinc-800/50 border-transparent focus:border-accent/40 rounded-xl transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["username", "email"].map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                          {t(`pages.register.${fieldName}`)}
                        </FormLabel>
                        <FormControl>
                          <Input
                            disabled={disabledFields.includes(fieldName)}
                            className="h-11 bg-zinc-100/50 dark:bg-zinc-800/50 border-transparent focus:border-accent/40 rounded-xl transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["password", "confirmPassword"].map((fieldName) => (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                          {t(`pages.register.${fieldName}`)}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            disabled={disabledFields.includes(fieldName)}
                            className="h-11 bg-zinc-100/50 dark:bg-zinc-800/50 border-transparent focus:border-accent/40 rounded-xl transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold uppercase tracking-wider" />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-accent text-accent-foreground font-black uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                disabled={loading}
              >
                {loading ? <Activity className="w-5 h-5 animate-spin" /> : submitLabel || t("pages.register.register")}
              </Button>

              {import.meta.env.VITE_FIREBASE_API_KEY && oauth && (
                <div className="space-y-6">
                  <div className="relative h-px bg-border">
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-background/0 backdrop-blur-none text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {t("pages.login.or_continue_with")}
                    </span>
                  </div>
                  <OAuth message="pages.register.register" />
                </div>
              )}
            </form>
          </Form>

          {oauth && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">
                {t("pages.register.already_have_account")}{" "}
                <Link
                  to="/login"
                  className="text-foreground font-bold hover:underline underline-offset-4 decoration-accent decoration-2 text-accent"
                >
                  {t("pages.register.login")}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
