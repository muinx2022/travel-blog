"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users } from "lucide-react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createUser,
  getUser,
  listRoles,
  updateUser,
  type RoleItem,
  type UserItem,
} from "@/lib/admin-api";

type UserFormProps = {
  mode: "create" | "edit";
  userId?: number;
};

type UserFormData = {
  username: string;
  email: string;
  password: string;
  roleId: string;
  blocked: boolean;
  confirmed: boolean;
};

const emptyForm: UserFormData = {
  username: "",
  email: "",
  password: "",
  roleId: "",
  blocked: false,
  confirmed: true,
};
type UserField = "username" | "email" | "password";
type UserErrors = Partial<Record<UserField, string>>;

function toFormData(item: UserItem): UserFormData {
  return {
    username: item.username ?? "",
    email: item.email ?? "",
    password: "",
    roleId: item.role?.id ? String(item.role.id) : "",
    blocked: Boolean(item.blocked),
    confirmed: Boolean(item.confirmed),
  };
}

export function UserForm({ mode, userId }: UserFormProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [errors, setErrors] = useState<UserErrors>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const roleItems = await listRoles();
        setRoles(roleItems);
        if (mode === "edit" && userId) {
          const user = await getUser(userId);
          setForm(toFormData(user));
        } else {
          setForm(emptyForm);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load user form");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [mode, userId]);

  const validateForm = () => {
    const nextErrors: UserErrors = {};
    if (!form.username.trim()) {
      nextErrors.username = "Username is required";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Invalid email format";
    }
    if (mode === "create" && !form.password) {
      nextErrors.password = "Password is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      toast({ title: "Please check input data", variant: "error" });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode === "edit" && userId) {
        await updateUser(userId, {
          username: form.username,
          email: form.email,
          password: form.password || undefined,
          roleId: form.roleId ? Number(form.roleId) : undefined,
          blocked: form.blocked,
          confirmed: form.confirmed,
        });
      } else {
        await createUser({
          username: form.username,
          email: form.email,
          password: form.password,
          roleId: form.roleId ? Number(form.roleId) : undefined,
          blocked: form.blocked,
          confirmed: form.confirmed,
        });
      }
      toast({
        title: mode === "edit" ? "User updated" : "User created",
        variant: "success",
      });
      router.push("/users");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save user");
      toast({
        title: "Failed to save user",
        description: submitError instanceof Error ? submitError.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>System</span>
            <span>/</span>
            <span className="text-foreground font-medium">{mode === "edit" ? "Edit User" : "New User"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {mode === "edit" ? "Edit User" : "Create User"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user account details and access status.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/users">Back to list</Link>
        </Button>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
          {!loading && (
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">Username</label>
                  <Input
                    placeholder="Username"
                    value={form.username}
                    className={errors.username ? "border-destructive focus-visible:ring-destructive/20" : ""}
                    onChange={(event) => setForm((p) => ({ ...p, username: event.target.value }))}
                    onBlur={() => {
                      if (!form.username.trim()) {
                        setErrors((prev) => ({ ...prev, username: "Username is required" }));
                      } else {
                        setErrors((prev) => ({ ...prev, username: undefined }));
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">Email</label>
                  <Input
                    placeholder="Email"
                    value={form.email}
                    className={errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}
                    onChange={(event) => setForm((p) => ({ ...p, email: event.target.value }))}
                    onBlur={() => {
                      if (!form.email.trim()) {
                        setErrors((prev) => ({ ...prev, email: "Email is required" }));
                      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
                        setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
                      } else {
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    required
                    type="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">
                    {mode === "edit" ? "Password (optional)" : "Password"}
                  </label>
                  <Input
                    placeholder={mode === "edit" ? "Leave blank to keep current password" : "Password"}
                    value={form.password}
                    className={errors.password ? "border-destructive focus-visible:ring-destructive/20" : ""}
                    onChange={(event) => setForm((p) => ({ ...p, password: event.target.value }))}
                    onBlur={() => {
                      if (mode === "create" && !form.password) {
                        setErrors((prev) => ({ ...prev, password: "Password is required" }));
                      } else {
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    required={mode === "create"}
                    type="password"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-foreground">Role</label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form.roleId}
                    onChange={(event) => setForm((p) => ({ ...p, roleId: event.target.value }))}
                  >
                    <option value="">No role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.blocked}
                    onChange={(event) => setForm((p) => ({ ...p, blocked: event.target.checked }))}
                  />
                  Blocked
                </label>
                <label className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.confirmed}
                    onChange={(event) => setForm((p) => ({ ...p, confirmed: event.target.checked }))}
                  />
                  Confirmed
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/users">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : mode === "edit" ? "Update User" : "Create User"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
