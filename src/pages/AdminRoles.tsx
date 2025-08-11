import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, User, Trash2, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  email: string;
  auth_user_id: string | null;
}

interface UserRoleRow {
  id: string;
  user_id: string;
  role: string;
}

const ALL_ROLES = ["admin", "manager", "finance", "instructor", "compliance"] as const;

type Role = typeof ALL_ROLES[number];

export default function AdminRoles() {
  const { userRole } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRoleByUser, setSelectedRoleByUser] = useState<Record<string, Role>>({});

  useEffect(() => {
    document.title = "Admin: Roles & Permissions";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Manage user roles and permissions for administrators.");
  }, []);

  useEffect(() => {
    if (userRole === "admin") {
      fetchData();
    }
  }, [userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: empData, error: empErr }, { data: roleData, error: roleErr }] = await Promise.all([
        supabase.from("employees").select("id, name, email, auth_user_id").order("name"),
        supabase.from("user_roles").select("id, user_id, role"),
      ]);
      if (empErr) throw empErr;
      if (roleErr) throw roleErr;
      setEmployees((empData || []) as Employee[]);
      setRoles((roleData || []) as UserRoleRow[]);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load roles data");
    } finally {
      setLoading(false);
    }
  };

  const rolesByUser = useMemo(() => {
    const map: Record<string, Role[]> = {} as any;
    roles.forEach((r) => {
      if (!map[r.user_id]) map[r.user_id] = [] as Role[];
      map[r.user_id].push(r.role as Role);
    });
    return map;
  }, [roles]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
  }, [employees, search]);

  const assignRole = async (userId: string, role: Role) => {
    setAssigning(`${userId}:${role}`);
    try {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) {
        if (String(error.message || "").toLowerCase().includes("duplicate")) {
          toast.info("Role already assigned");
        } else {
          throw error;
        }
      } else {
        toast.success("Role assigned");
        await fetchData();
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to assign role");
    } finally {
      setAssigning(null);
    }
  };

  const removeRole = async (userId: string, role: Role) => {
    setAssigning(`${userId}:${role}`);
    try {
      const { error } = await supabase.from("user_roles").delete().match({ user_id: userId, role });
      if (error) throw error;
      toast.success("Role removed");
      await fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to remove role");
    } finally {
      setAssigning(null);
    }
  };

  if (userRole !== "admin") {
    return (
      <Alert>
        <AlertDescription>Access denied. Only administrators can manage roles.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground">Assign and revoke roles for users</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email"
                  className="pl-8 w-72"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map((emp) => {
                const userId = emp.auth_user_id;
                const empRoles = userId ? rolesByUser[userId] || [] : [];
                const selected = selectedRoleByUser[emp.id] || (ALL_ROLES[0] as Role);
                return (
                  <div key={emp.id} className="flex items-center justify-between gap-4 p-3 border rounded-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <User className="w-5 h-5 text-primary" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{emp.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                        {!userId && (
                          <p className="text-xs text-muted-foreground">No linked account yet (auth_user_id is null)</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {empRoles.length ? (
                        empRoles.map((r) => (
                          <span key={r} className="inline-flex items-center gap-1">
                            <Badge>{r}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => userId && removeRole(userId, r as Role)}
                              disabled={assigning === `${userId}:${r}`}
                              title="Remove role"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No roles</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selected}
                        onValueChange={(val) =>
                          setSelectedRoleByUser((s) => ({ ...s, [emp.id]: val as Role }))
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => userId && assignRole(userId, selected)}
                        disabled={!userId || assigning === `${userId}:${selected}`}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Assign
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredEmployees.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">No users found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
