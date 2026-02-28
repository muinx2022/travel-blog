"use client";

import { ResourceFormPage } from "@/components/resource-form-page";
import { getHotel, createHotel, updateHotel } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default function NewHotelPage() {
  const fields = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", required: true },
    { name: "author", label: "Author", type: "author", required: true },
    { name: "categories", label: "Categories", type: "categories", required: true },
    { name: "excerpt", label: "Excerpt", type: "textarea" },
    { name: "content", label: "Content", type: "richtext", required: true },
    { name: "address", label: "Address", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "starRating", label: "Star Rating", type: "text" },
    { name: "videoUrl", label: "Video URL", type: "text" },
    { name: "amenities", label: "Amenities", type: "custom", render: (form: any, setForm: any) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Hotel Amenities</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, amenities: [...form.amenities, { name: "" }] })}>
                <Plus className="mr-1 h-4 w-4" />
                Add amenity
            </Button>
            </div>
            {form.amenities.length === 0 && <p className="text-sm text-muted-foreground">No amenities yet.</p>}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {form.amenities.map((amenity: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                <Input className="h-9" placeholder="Amenity name" value={amenity.name} onChange={(e) => {
                    const newAmenities = [...form.amenities];
                    newAmenities[index].name = e.target.value;
                    setForm({ ...form, amenities: newAmenities });
                }} />
                <Button type="button" variant="destructive" size="icon-xs" onClick={() => {
                    const newAmenities = [...form.amenities];
                    newAmenities.splice(index, 1);
                    setForm({ ...form, amenities: newAmenities });
                }} title="Delete amenity">
                    <Trash2 className="h-3 w-3" />
                </Button>
                </div>
            ))}
            </div>
        </div>
    )},
    { name: "roomTypes", label: "Room Types", type: "custom", render: (form: any, setForm: any) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Room Types</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, roomTypes: [...form.roomTypes, { name: "", description: "", price: undefined, available: true, amenities: "", videoUrl: "" }] })}>
                <Plus className="mr-1 h-4 w-4" />
                Add room type
            </Button>
            </div>
            {form.roomTypes.length === 0 && <p className="text-sm text-muted-foreground">No room types yet.</p>}
            {form.roomTypes.map((roomType: any, index: number) => (
                <div key={index} className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Input
                            className="h-8 text-sm font-medium"
                            placeholder="Room type name (required)"
                            value={roomType.name}
                            onChange={(e) => {
                                const newRoomTypes = [...form.roomTypes];
                                newRoomTypes[index].name = e.target.value;
                                setForm({ ...form, roomTypes: newRoomTypes });
                            }}
                        />
                        <Button type="button" variant="destructive" size="icon-xs" onClick={() => {
                            const newRoomTypes = [...form.roomTypes];
                            newRoomTypes.splice(index, 1);
                            setForm({ ...form, roomTypes: newRoomTypes });
                        }} title="Delete room type">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                    <Textarea
                        placeholder="Room type description"
                        rows={2}
                        value={roomType.description ?? ""}
                        onChange={(e) => {
                            const newRoomTypes = [...form.roomTypes];
                            newRoomTypes[index].description = e.target.value;
                            setForm({ ...form, roomTypes: newRoomTypes });
                        }}
                    />
                </div>
            ))}
        </div>
    )},
  ];

  const initialFormState = {
    title: "",
    slug: "",
    excerpt: "",
    content: "<p></p>",
    address: "",
    city: "",
    starRating: "",
    videoUrl: "",
    categoryDocumentIds: [],
    authorId: "",
    authorLabel: "",
    thumbnailId: null,
    imageIds: [],
    amenities: [],
    roomTypes: [],
  };

  const api = {
    get: getHotel,
    create: createHotel,
    update: updateHotel,
  };

  return (
    <ResourceFormPage
      mode="create"
      resourceName="Hotel"
      resourceNamePlural="Hotels"
      api={api}
      fields={fields}
      initialFormState={initialFormState}
    />
  );
}
