"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listAllTags, createTag, type TagItem } from "@/lib/admin-api";
import { slugify } from "@/lib/slug";

type TagPickerProps = {
  selectedTagIds: string[];
  onSelectedTagIdsChange: (ids: string[]) => void;
};

export function TagPicker({ selectedTagIds, onSelectedTagIdsChange }: TagPickerProps) {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const allTags = await listAllTags();
        setTags(allTags);
      } catch (error) {
        console.error("Failed to load tags", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const trimmed = input.trim();
  const minChars = 2;
  const showSuggestions = trimmed.length >= minChars;
  const filteredTags = showSuggestions
    ? tags.filter((tag) => tag.name.toLowerCase().includes(trimmed.toLowerCase()))
    : [];
  const tagExists = trimmed && tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
  const showAddNew = trimmed && !tagExists;

  const suggestions: ({ type: "tag"; tag: TagItem } | { type: "add"; name: string })[] = [
    ...filteredTags.map((tag) => ({ type: "tag" as const, tag })),
    ...(showAddNew ? [{ type: "add" as const, name: trimmed }] : []),
  ];

  useEffect(() => {
    setHighlightIndex(0);
  }, [input]);

  const upsertAndGetId = async (name: string): Promise<string | null> => {
    const n = name.trim();
    if (!n) return null;
    const existing = tags.find((t) => t.name.toLowerCase() === n.toLowerCase());
    if (existing) return existing.documentId;
    try {
      const slug = slugify(n) || n.toLowerCase().replace(/\s+/g, "-");
      const created = await createTag({ name: n, slug });
      setTags((prev) => [created, ...prev]);
      return created.documentId;
    } catch (err) {
      console.error("Failed to create tag", err);
      return null;
    }
  };

  const addTagById = (documentId: string) => {
    if (selectedTagIds.includes(documentId)) return;
    onSelectedTagIdsChange([...selectedTagIds, documentId]);
  };

  const addTag = async (name: string) => {
    const id = await upsertAndGetId(name);
    if (id) addTagById(id);
  };

  const handleComma = () => {
    if (!trimmed) return;
    addTag(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ",") {
      e.preventDefault();
      handleComma();
      return;
    }
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = suggestions[highlightIndex];
      if (item.type === "tag") {
        addTagById(item.tag.documentId);
      } else {
        addTag(item.name);
      }
      setInput("");
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes(",")) return;
    e.preventDefault();
    const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
    const ids = await Promise.all(parts.map((p) => upsertAndGetId(p)));
    const validIds = ids.filter((id): id is string => id !== null);
    onSelectedTagIdsChange(Array.from(new Set([...selectedTagIds, ...validIds])));
    setInput("");
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150);
  };

  const selectedTags = selectedTagIds
    .map((id) => tags.find((t) => t.documentId === id))
    .filter((t) => t !== undefined) as TagItem[];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.documentId}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => onSelectedTagIdsChange(selectedTagIds.filter((id) => id !== tag.documentId))}
              className="ml-1 inline hover:opacity-70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Gõ tag, dùng dấu phẩy (,) để thêm (vd: Tràng An, Chùa Thầy)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={loading}
        />
        {showDropdown && showSuggestions && (suggestions.length > 0 || loading) && (
          <div
            className="absolute z-10 mt-1 w-full rounded-md border bg-popover py-1 shadow-md max-h-48 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            {loading ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Đang tải...</p>
            ) : (
              suggestions.map((item, idx) => {
                if (item.type === "tag") {
                  return (
                    <button
                      key={item.tag.documentId}
                      type="button"
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted cursor-pointer ${
                        highlightIndex === idx ? "bg-muted" : ""
                      }`}
                      onMouseDown={() => {
                        addTagById(item.tag.documentId);
                        setInput("");
                      }}
                    >
                      <span>{item.tag.name}</span>
                    </button>
                  );
                }
                return (
                  <button
                    key="add-new"
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted cursor-pointer text-blue-600 ${
                      highlightIndex === idx ? "bg-muted" : ""
                    }`}
                    onMouseDown={() => {
                      addTag(item.name);
                      setInput("");
                    }}
                  >
                    <span className="text-sm">Thêm tag mới: &quot;{item.name}&quot;</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
