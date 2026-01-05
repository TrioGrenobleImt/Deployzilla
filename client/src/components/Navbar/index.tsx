import { Link, useNavigate, useLocation } from "react-router-dom";
import { LanguageChanger } from "./languageChanger";
import { ThemeChanger } from "./themeChanger";
import { useTranslation } from "react-i18next";
import { Separator } from "../ui/separator";
import { Home, House, LogOut, Menu, User, Wrench, X, Globe, Shield, Terminal, Zap } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useAuthContext } from "@/contexts/authContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useLogout } from "@/hooks/useLogout";
import { AvatarWithStatusCell } from "@/components/customs/avatarStatusCell";
import { useConfigContext } from "../../contexts/configContext";
import { useProjectContext } from "../../contexts/projectContext";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout, loading } = useLogout();
  const { authUser } = useAuthContext();
  const { getConfigValue } = useConfigContext();
  const { projects, selectedProject, setSelectedProject } = useProjectContext();

  useEffect(() => {
    const fetchConfigValues = async () => {
      const values = await getConfigValue(["APP_NAME"]);
      setConfigValues(values);
    };
    fetchConfigValues();
  }, [getConfigValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const closeDialogAndNavigate = (link: string) => {
    setIsOpen(false);
    navigate(link);
  };

  const navLinks = [
    {
      label: t("navbar.home"),
      path: "/",
      icon: Home,
      auth: true,
    },
    {
      label: t("navbar.account"),
      path: "/account",
      icon: User,
      auth: true,
    },
    {
      label: t("navbar.dashboard"),
      path: "/admin/dashboard",
      icon: Wrench,
      auth: authUser?.role === "admin",
    },
  ];

  const mobileLinks = [
    {
      label: t("navbar.home"),
      path: "/",
      icon: House,
    },
    {
      label: t("navbar.account"),
      path: "/account",
      icon: User,
      auth: !!authUser,
    },
    {
      label: t("navbar.dashboard"),
      path: "/admin/dashboard",
      icon: Wrench,
      auth: authUser?.role === "admin",
    },
  ];

  return (
    <>
      <div className="sticky top-0 left-0 right-0 z-50 border-b bg-background">
        {/* Desktop */}
        <div className="hidden select-none md:flex items-center justify-between p-4 px-8 text-accent">
          <div className="text-3xl font-extrabold">
            <Link to="/">{configValues["APP_NAME"]}</Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              {authUser ? (
                <>
                  {navLinks
                    .filter((link) => link.auth)
                    .map((link) => (
                      <Button
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        variant="ghost"
                        className={cn(
                          "h-9 px-4 text-xs font-bold uppercase tracking-widest transition-all",
                          location.pathname === link.path ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <link.icon className="w-3.5 h-3.5 mr-2" />
                        {link.label}
                      </Button>
                    ))}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="hover:cursor-pointer">
                      <div className="flex items-center gap-3 pl-2 pr-1 h-9 rounded-full bg-muted/50 border border-border/50 hover:bg-muted transition-colors transition-all">
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 border-accent text-accent font-bold uppercase tracking-tighter"
                        >
                          {authUser.role}
                        </Badge>
                        <AvatarWithStatusCell user={authUser} />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                      <DropdownMenuLabel>
                        {authUser.name} {authUser.forename}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        {navLinks
                          .filter((link) => link.auth)
                          .map((link) => (
                            <DropdownMenuItem
                              key={link.path}
                              className="flex items-center gap-2 hover:cursor-pointer"
                              onClick={() => navigate(link.path)}
                            >
                              {link.label}
                              <DropdownMenuShortcut>
                                <link.icon className="w-4 h-4" />
                              </DropdownMenuShortcut>
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem className="hover:cursor-pointer" onClick={() => logout()} disabled={loading}>
                          {t("navbar.logout")}
                          <DropdownMenuShortcut>
                            <LogOut className="w-4 h-4" />
                          </DropdownMenuShortcut>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button onClick={() => navigate("/login")} variant="link">
                  {t("navbar.login")}
                </Button>
              )}
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center justify-between gap-4">
              {authUser && projects.length > 0 && (
                <Select value={selectedProject?._id} onValueChange={(id) => setSelectedProject(projects.find((p) => p._id === id) || null)}>
                  <SelectTrigger className="w-[220px] h-9 bg-muted/50 border-border/50 text-xs font-black uppercase tracking-widest text-accent transition-all px-4 group">
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <Zap className="w-3.5 h-3.5 shrink-0 fill-accent group-hover:animate-pulse" />
                      <div className="truncate flex-1 text-left font-mono">
                        <SelectValue placeholder={t("pages.home.project_select_placeholder")} />
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border/50">
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project._id} className="text-xs uppercase tracking-widest">
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <ThemeChanger />
              <LanguageChanger />
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <div className="text-3xl font-extrabold text-accent">
            <Link to="/">{configValues["APP_NAME"]}</Link>
          </div>
          <Menu onClick={() => setIsOpen(!isOpen)} className="cursor-pointer" />
        </div>

        <div
          ref={menuRef}
          className={cn(
            "fixed top-0 right-0 w-4/5 h-screen overflow-hidden bg-background transition-transform duration-300 ease-in-out z-20",
            isOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex justify-end">
            <X onClick={() => setIsOpen(!isOpen)} className="m-4 cursor-pointer" />
          </div>
          <div className="flex flex-col gap-4 p-8 pt-2">
            {mobileLinks
              .filter((link) => link.auth === undefined || link.auth)
              .map((link) => (
                <Button
                  key={link.path}
                  onClick={() => closeDialogAndNavigate(link.path)}
                  variant="link"
                  className="flex items-center justify-start gap-4"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              ))}
            {authUser && (
              <>
                <Separator />
                <Button onClick={() => logout()} variant="link" disabled={loading} className="flex items-center justify-start gap-4">
                  <LogOut className="w-4 h-4" />
                  {t("navbar.logout")}
                </Button>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-center gap-4">
              <LanguageChanger />
              <ThemeChanger />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
