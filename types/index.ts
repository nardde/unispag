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

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  year_of_study: number | null;
  role: UserRole;
  onboarding_completed: boolean;
  feedback_given: boolean;
  visit_count: number;
  first_visit_at: string | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  rating: number | null;
  liked: string[] | null;
  improvements: string[] | null;
  improvements_other: string | null;
  nps_score: number | null;
  contact_email: string | null;
  created_at: string;
}

export const FEEDBACK_LIKES = [
  'Fácil de usar',
  'Buena organización',
  'Muchos archivos',
  'Diseño limpio',
  'Útil para estudiar',
] as const;

export const FEEDBACK_IMPROVEMENTS = [
  'Faltan archivos',
  'Faltan materias',
  'Faltan universidades',
  'La app es lenta',
  'Es difícil encontrar lo que busco',
  'Otro',
] as const;

export const RATING_LABELS: Record<number, string> = {
  1: 'Necesita mucha mejora',
  2: 'Podría ser mejor',
  3: 'Está bien',
  4: 'Me gusta bastante',
  5: '¡Me encanta!',
};

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  file_id: string | null;
  reported_by: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export const REPORT_REASONS = [
  'Contenido inapropiado',
  'Archivo incorrecto',
  'No corresponde a la materia',
  'Otro',
] as const;

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
  // Aggregates computed client-side (ratings)
  score?: number;
  my_vote?: 0 | 1 | -1;
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
