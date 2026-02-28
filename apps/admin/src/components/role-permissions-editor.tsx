"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAvailableActions,
  getRolePermissions,
  listRoles,
  setRolePermissions,
  updateRole,
  type ActionItem,
  type PermissionMap,
  type RoleItem,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";

interface Props {
  roleId: number;
}

function groupByResource(actions: ActionItem[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const { resource, action } of actions) {
    if (!map[resource]) map[resource] = [];
    map[resource].push(action);
  }
  return map;
}

function resourceLabel(resource: string) {
  return resource
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function RolePermissionsEditor({ roleId }: Props) {
  const router = useRouter();
  const canUpdate = can("user", "update");

  const [role, setRole] = useState<RoleItem | null>(null);
  const [grouped, setGrouped] = useState<Record<string, string[]>>({});
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roles, actions, perms] = await Promise.all([
        listRoles(),
        getAvailableActions(),
        getRolePermissions(roleId),
      ]);
      const found = roles.find((r) => r.id === roleId) ?? null;
      setRole(found);
      setEditName(found?.name ?? "");
      setEditDesc(found?.description ?? "");
      setGrouped(groupByResource(actions));
      setPermissions(perms ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load role");
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (resource: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [action]: !prev[resource]?.[action],
      },
    }));
  };

  const toggleAll = (resource: string) => {
    const actions = grouped[resource] ?? [];
    const allGranted = actions.every((a) => permissions[resource]?.[a]);
    setPermissions((prev) => ({
      ...prev,
      [resource]: Object.fromEntries(actions.map((a) => [a, !allGranted])),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setRolePermissions(roleId, permissions);
      toast({ title: "Permissions saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to save permissions",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeta = async () => {
    if (!editName.trim()) return;
    setSavingMeta(true);
    try {
      await updateRole(roleId, { name: editName.trim(), description: editDesc.trim() || undefined });
      toast({ title: "Role updated", variant: "success" });
      router.push("/roles");
    } catch (err) {
      toast({
        title: "Failed to update role",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
      setSavingMeta(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!role) {
    return <p className="text-sm text-destructive">Role not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href="/roles">
            <ArrowLeft className="h-4 w-4" />
            Back to Roles
          </Link>
        </Button>
      </div>

      {/* Role info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={!canUpdate}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <input
              className="w-full rounded border px-3 py-1.5 text-sm"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              disabled={!canUpdate}
            />
          </div>
          {canUpdate && (
            <Button size="sm" onClick={handleSaveMeta} disabled={savingMeta || !editName.trim()}>
              {savingMeta ? "Saving..." : "Save"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Permissions grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Permissions</CardTitle>
            {canUpdate && (
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Permissions"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(grouped).map(([resource, actions]) => {
              const allGranted = actions.every((a) => permissions[resource]?.[a]);
              return (
                <div key={resource} className="rounded-md border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{resourceLabel(resource)}</span>
                    {canUpdate && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                        onClick={() => toggleAll(resource)}
                      >
                        {allGranted ? "Revoke all" : "Grant all"}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {actions.map((action) => (
                      <label key={action} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={permissions[resource]?.[action] === true}
                          onChange={() => canUpdate && toggle(resource, action)}
                          disabled={!canUpdate}
                        />
                        {action}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
