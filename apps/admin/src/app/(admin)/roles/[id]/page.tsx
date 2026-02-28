import { RolePermissionsEditor } from "@/components/role-permissions-editor";

export const dynamic = "force-dynamic";

type RolePageProps = {
  params: Promise<{ id: string }>;
};

export default async function RolePage({ params }: RolePageProps) {
  const { id } = await params;
  const roleId = Number(id);

  if (!Number.isFinite(roleId) || roleId <= 0) {
    return <p className="text-sm text-destructive">Invalid role id</p>;
  }

  return <RolePermissionsEditor roleId={roleId} />;
}
