export function slugifyVi(input: string) {
  return input
    .replace(/\s*&\s*/g, " va ")
    .toLowerCase()
    .replace(/đ/g, "d")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
