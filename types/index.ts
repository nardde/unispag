export type FileCategory = 'notes' | 'exam' | 'summary' | 'other';

export interface University {
  id: string;
  name: string;
  slug: string;
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

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface FileRecord {
  id: string;
  career_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: FileCategory;
  subject: string;
  semester: string | null;
  year: number | null;
  file_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
  // Joined relation (optional, populated by some queries)
  profiles?: Pick<Profile, 'username'> | null;
}

export interface UniversityWithCount extends University {
  careerCount: number;
}

export const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: 'notes', label: 'Apuntes' },
  { value: 'exam', label: 'Examen' },
  { value: 'summary', label: 'Resumen' },
  { value: 'other', label: 'Otro' },
];

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  notes: 'Apuntes',
  exam: 'Examen',
  summary: 'Resumen',
  other: 'Otro',
};
