// Converts any string to a URL-safe slug
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')                        // decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')         // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')           // remove non-alphanumeric except spaces/dashes
    .trim()
    .replace(/[\s_]+/g, '-')                 // spaces and underscores → dash
    .replace(/-+/g, '-')                     // collapse multiple dashes
    .replace(/^-|-$/g, '')                   // strip leading/trailing dashes
}

// Generates a table slug, ensuring some basic uniqueness
export function generateTableSlug(tableName: string): string {
  return slugify(tableName)
}

// Generates an event slug from title + date
export function generateEventSlug(title: string, date?: string): string {
  const base = slugify(title)
  if (date) {
    const datePart = new Date(date).toISOString().split('T')[0]
    return `${base}-${datePart}`
  }
  return base
}
