import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

type ResourceViewPageProps = {
  resourceName: string;
  documentId: string;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
};

export function ResourceViewPage({
  resourceName,
  documentId,
  loading,
  error,
  children,
}: ResourceViewPageProps) {
  const resourceNamePlural = `${resourceName.toLowerCase()}s`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{resourceName} View</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/${resourceNamePlural}`}>Back to list</Link>
              </Button>
              <Button asChild>
                <Link href={`/${resourceNamePlural}/${documentId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && children}
        </CardContent>
      </Card>
    </div>
  );
}
