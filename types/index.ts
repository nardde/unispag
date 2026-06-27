export type FileCategory = 'notes' | 'exam' | 'summary' | 'other';

export interface University {
  id: string;
  name: string;
  slug: string;
  acronym: string | null;
  zone: string | null;
  logo_url: string | null;
  description: string | null;
}

export interface Career {
  id: string;
  university_id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Subject {
  id: string;
  career_id: string;
  name: string;
  slug: string;
  description: string | null;
  year: number; // 1..6
  semester: number; // 1 | 2
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface FileRecord {
  id: string;
  career_id: string;
  subject_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  category: FileCategory;
  subject: string; // legacy free-text label (kept as fallback)
  semester: string | null;
  year: number | null;
  file_url: string;
  file_name: string;
  file_size: number;
  downloads: number;
  created_at: string;
  // Joined relations (optional, populated by some queries)
  profiles?: Pick<Profile, 'username'> | null;
  subjects?: Pick<Subject, 'name' | 'slug'> | null;
}

export interface UniversityWithCount extends University {
  careerCount: number;
}

export interface CareerWithCount extends Career {
  fileCount: number;
}

export interface SubjectWithCount extends Subject {
  fileCount: number;
}

export const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: 'notes', label: 'Apuntes' },
  { value: 'exam', label: 'Parciales' },
  { value: 'summary', label: 'Resúmenes' },
  { value: 'other', label: 'Otros' },
];

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  notes: 'Apuntes',
  exam: 'Parciales',
  summary: 'Resúmenes',
  other: 'Otros',
};

/** Ordinal Spanish label for a curriculum year (1 -> "1° Año"). */
export function yearLabel(year: number): string {
  return `${year}° Año`;
}

/** Ordinal Spanish label for a semester (1 -> "1° Cuatrimestre"). */
export function semesterLabel(semester: number): string {
  return `${semester}° Cuatrimestre`;
}
