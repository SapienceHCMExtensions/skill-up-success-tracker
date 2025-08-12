import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { icons } from "lucide-react";

type UserRole = string | undefined;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: UserRole;
  onLogout: () => void;
}

const routes = [
  { label: "Dashboard", path: "/", icon: "LayoutDashboard" },
  { label: "Courses", path: "/courses", icon: "BookOpen" },
  { label: "Sessions", path: "/sessions", icon: "Calendar" },
  { label: "Training Requests", path: "/training-requests", icon: "ClipboardList" },
  { label: "Plans", path: "/plans", icon: "ListChecks" },
  { label: "Costs", path: "/costs", icon: "Wallet" },
  { label: "Evaluations", path: "/evaluations", icon: "ChartBar" },
  { label: "My Tasks", path: "/my-tasks", icon: "CheckCircle2" },
];

const adminRoutes = [
  { label: "Organization settings", path: "/admin/org-settings", icon: "Building2" },
  { label: "Admin", path: "/admin", icon: "Shield" },
];

export function CommandPalette({ open, onOpenChange, userRole, onLogout }: CommandPaletteProps) {
  const navigate = useNavigate();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command shouldFilter>
        <CommandInput placeholder="Search pages and actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigate">
            {routes.map(({ label, path, icon }) => {
              const LucideIcon = (icons as any)[icon];
              return (
                <CommandItem key={path} value={label} onSelect={() => go(path)}>
                  {LucideIcon ? <LucideIcon className="mr-2 h-4 w-4" /> : null}
                  <span>{label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {userRole === "admin" && (
            <CommandGroup heading="Admin">
              {adminRoutes.map(({ label, path, icon }) => {
                const LucideIcon = (icons as any)[icon];
                return (
                  <CommandItem key={path} value={label} onSelect={() => go(path)}>
                    {LucideIcon ? <LucideIcon className="mr-2 h-4 w-4" /> : null}
                    <span>{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => go("/profile")}>Profile settings</CommandItem>
            {userRole === "admin" && (
              <CommandItem onSelect={() => go("/admin/org-settings")}>Organization settings</CommandItem>
            )}
            <CommandItem onSelect={() => { onOpenChange(false); onLogout(); }}>Logout</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
