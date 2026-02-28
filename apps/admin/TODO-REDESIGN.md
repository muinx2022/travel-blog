# Admin Redesign TODO

## Completed ✓

### 1. Manager Components - Hover Action Overlays
- [x] hotels-manager.tsx - Fixed syntax errors, added hover overlay with darker shadows, added toggle status button
- [x] tours-manager.tsx - Added hover overlay, removed Actions column header, added toggle status button
- [x] homestays-manager.tsx - Added hover overlay, updated grid cols, fixed location display, added toggle status button
- [x] restaurants-manager.tsx - Added hover overlay, updated grid cols, fixed location display, added toggle status button
- [x] souvenir-shops-manager.tsx - Added hover overlay, updated grid cols, fixed location display, added toggle status button
- [x] posts-manager.tsx - Added toggle status button to overlay
- [x] users-manager.tsx - Already had hover overlay pattern with status badges
- [x] tags-manager.tsx - Added hover overlay, consistent page header, toggle status button
- [x] comments-manager.tsx - Added hover overlay, consistent page header, toggle status button
- [x] reports-manager.tsx - Added hover overlay, consistent page header
- [x] roles-manager.tsx - Added hover overlay, consistent page header with Shield icon


### 2. Toggle Status Button in Overlays
- [x] Added publish/unpublish toggle button to all manager overlays
- [x] Consistent styling: emerald when published, muted when draft
- [x] Uses CheckCircle2/XCircle icons for visual feedback
- [x] Respects canTogglePublish permission


### 2. Design System Consistency
- [x] Consistent grid layouts: `[1fr_140px_100px]` for card-based managers
- [x] Consistent table layouts with hover overlays for table-based managers
- [x] Darker shadow overlays: `shadow-[-8px_0_16px_rgba(0,0,0,0.15)] dark:shadow-[-8px_0_16px_rgba(0,0,0,0.4)]`
- [x] Consistent status badges (emerald for active/published, amber for pending/draft)
- [x] Consistent toggle switches for publish/unpublish
- [x] Consistent page headers with breadcrumbs
- [x] Consistent filter cards with shadow-md
- [x] Consistent empty states with icons and helpful text

### 3. Visual Improvements
- [x] Backdrop blur on hover overlays (`backdrop-blur-sm`)
- [x] Semi-transparent background (`bg-background/95`)
- [x] Border separation (`border-l border-border/50`)
- [x] Smooth transitions (`transition-all duration-200`)

## Files Modified
1. apps/admin/src/components/hotels-manager.tsx
2. apps/admin/src/components/tours-manager.tsx
3. apps/admin/src/components/homestays-manager.tsx
4. apps/admin/src/components/restaurants-manager.tsx
5. apps/admin/src/components/souvenir-shops-manager.tsx
6. apps/admin/src/components/posts-manager.tsx
7. apps/admin/src/components/tags-manager.tsx
8. apps/admin/src/components/comments-manager.tsx
9. apps/admin/src/components/reports-manager.tsx
10. apps/admin/src/components/roles-manager.tsx


## Design Pattern Applied

### Full-Row Hover Action Overlay (Updated)
```tsx
<div className="group relative">
  {/* Row content */}
  
  {/* Full Row Hover Actions Overlay - Two Part Design with Darker Shadows */}
  <div className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 pointer-events-none">
    {/* Left part - Wider darker gradient to obscure entire row */}
    <div className="h-full flex-1 bg-gradient-to-r from-transparent via-background/95 to-background dark:via-background/98 dark:to-background" />
    {/* Right part - Action buttons with solid darker background */}
    <div className="h-full flex items-center gap-1 px-4 bg-background/98 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] dark:shadow-[-20px_0_40px_rgba(0,0,0,0.95)] border-l border-border/50 backdrop-blur-sm pointer-events-auto">
      <IconAction label="View" icon={<Eye className="h-4 w-4" />} href={`/path/${id}/view`} variant="ghost" />
      {/* Toggle Status Button */}
      {canTogglePublish && (
        <button
          type="button"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
            item.publishedAt
              ? "text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
              : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
          )}
          onClick={() => onTogglePublished(item)}
          disabled={togglingDocumentId === item.documentId}
          title={item.publishedAt ? "Unpublish" : "Publish"}
        >
          {item.publishedAt ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        </button>
      )}
      <IconAction label="Edit" icon={<Pencil className="h-4 w-4" />} href={`/path/${id}/edit`} variant="ghost" />
      <button type="button" className="hover:bg-destructive/10 hover:text-destructive" title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
</div>
```



### Status Toggle
```tsx
<button
  type="button"
  className={cn(
    "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200",
    item.publishedAt 
      ? "bg-emerald-500 hover:bg-emerald-600" 
      : "bg-muted-foreground/30 hover:bg-muted-foreground/40"
  )}
>
  <span className={cn(
    "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
    item.publishedAt ? "translate-x-5" : "translate-x-0.5"
  )} />
</button>
```

### Status Badge (Read-only)
```tsx
<span className={cn(
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
  item.publishedAt 
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
)}>
  {item.publishedAt ? <><CheckCircle2 className="h-3 w-3" /> Published</> : <><XCircle className="h-3 w-3" /> Draft</>}
</span>
