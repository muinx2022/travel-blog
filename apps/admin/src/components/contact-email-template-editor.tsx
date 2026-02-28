"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import { Mail, Loader2, XCircle } from "lucide-react";
import { toast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getContactEmailTemplate,
  updateContactEmailTemplate,
  type ContactEmailTemplateInput,
} from "@/lib/admin-api";
import { can } from "@/lib/permissions";

type TemplateFields = {
  ownerSubject?: string;
  ownerBody?: string;
  adminSubject?: string;
  adminBody?: string;
  requesterSubject?: string;
  requesterBody?: string;
};

type ServiceKey = "hotel" | "tour" | "souvenir-shop" | "restaurant" | "homestay" | "other";

const serviceOptions: Array<{ value: ServiceKey; label: string }> = [
  { value: "hotel", label: "Hotel" },
  { value: "tour", label: "Tour" },
  { value: "souvenir-shop", label: "Shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "homestay", label: "Homestay" },
  { value: "other", label: "Other" },
];

const defaultForm: ContactEmailTemplateInput = {
  ownerSubject: "",
  ownerBody: "",
  adminSubject: "",
  adminBody: "",
  requesterSubject: "",
  requesterBody: "",
  serviceOverrides: {},
};

export function ContactEmailTemplateEditor() {
  const canUpdate = can("contactEmailTemplate", "update");
  const [form, setForm] = useState<ContactEmailTemplateInput>(defaultForm);
  const [serviceKey, setServiceKey] = useState<ServiceKey>("hotel");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getContactEmailTemplate();
        if (!cancelled) {
          setForm({ ...defaultForm, ...data });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load template");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);
      await updateContactEmailTemplate(form);
      toast({ title: "Template saved", variant: "success" });
    } catch (saveError) {
      toast({
        title: "Failed to save template",
        description: saveError instanceof Error ? saveError.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const bind = (key: keyof ContactEmailTemplateInput) => ({
    value: String(form[key] ?? ""),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  const serviceOverride = (form.serviceOverrides ?? {})[serviceKey] ?? {};
  const bindOverride = (key: keyof TemplateFields) => ({
    value: String(serviceOverride[key] ?? ""),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({
        ...prev,
        serviceOverrides: {
          ...(prev.serviceOverrides ?? {}),
          [serviceKey]: {
            ...((prev.serviceOverrides ?? {})[serviceKey] ?? {}),
            [key]: event.target.value,
          },
        },
      })),
  });

  const clearOverride = () => {
    setForm((prev) => {
      const next = { ...(prev.serviceOverrides ?? {}) };
      delete next[serviceKey];
      return { ...prev, serviceOverrides: next };
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>Management</span>
            <span>/</span>
            <span className="text-foreground font-medium">Email Templates</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Contact Email Template
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure email templates for contact requests</p>
        </div>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-sm font-semibold">Template Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading template...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}
        {!loading && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Default Owner Subject</span>
                <input className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...bind("ownerSubject")} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Default Admin Subject</span>
                <input className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...bind("adminSubject")} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Default Requester Subject</span>
                <input
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  {...bind("requesterSubject")}
                />
              </label>
            </div>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Default Owner Body</span>
              <textarea className="min-h-32 w-full rounded-md border bg-background p-3 text-sm" {...bind("ownerBody")} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Default Admin Body</span>
              <textarea className="min-h-32 w-full rounded-md border bg-background p-3 text-sm" {...bind("adminBody")} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Default Requester Body</span>
              <textarea
                className="min-h-32 w-full rounded-md border bg-background p-3 text-sm"
                {...bind("requesterBody")}
              />
            </label>
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Service-specific Overrides</h3>
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={serviceKey}
                  onChange={(event) => setServiceKey(event.target.value as ServiceKey)}
                >
                  {serviceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave fields empty to fallback to default template above.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Owner Subject ({serviceKey})</span>
                  <input className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...bindOverride("ownerSubject")} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Admin Subject ({serviceKey})</span>
                  <input className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...bindOverride("adminSubject")} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-medium">Requester Subject ({serviceKey})</span>
                  <input className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...bindOverride("requesterSubject")} />
                </label>
              </div>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Owner Body ({serviceKey})</span>
                <textarea className="min-h-28 w-full rounded-md border bg-background p-3 text-sm" {...bindOverride("ownerBody")} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Admin Body ({serviceKey})</span>
                <textarea className="min-h-28 w-full rounded-md border bg-background p-3 text-sm" {...bindOverride("adminBody")} />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Requester Body ({serviceKey})</span>
                <textarea className="min-h-28 w-full rounded-md border bg-background p-3 text-sm" {...bindOverride("requesterBody")} />
              </label>
              {canUpdate && (
                <div>
                  <Button type="button" variant="outline" onClick={clearOverride}>
                    Clear {serviceKey} override
                  </Button>
                </div>
              )}
            </div>
            {canUpdate && (
              <div className="pt-4 border-t">
                <Button type="button" onClick={onSave} disabled={saving} className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  {saving ? "Saving..." : "Save Template"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
