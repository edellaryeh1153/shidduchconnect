export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'shadchan' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
};

export type Profile = {
  id: string;
  created_by: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  gender: string;
  age: number | null;
  date_of_birth: string | null;
  height: string;
  height_inches: number | null;
  hair_color: string;
  eye_color: string;
  skin_tone: string;
  build: string;
  hashkafa: string;
  city: string;
  state: string;
  occupation: string;
  learning_status: string;
  smoking: string;
  num_siblings: number | null;
  position_in_family: string;
  where_to_live: string;
  shul: string;
  rav: string;
  camp: string;
  languages: string;
  personality_traits: string[];
  looking_for_description: string;
  ready_to_date: string;
  date_available: string;
  profile_visibility: 'private' | 'shared' | 'organization';
  about: string;
  family_info: string;
  references: string;
  resume: string;
  photo_url: string | null;
  resume_url: string | null;
  personal_phone: string;
  mother_name: string;
  mother_phone: string;
  father_name: string;
  father_phone: string;
  notes: string;
  schools: Record<string, string>;
  preferences: {
    ageMin?: string;
    ageMax?: string;
    heightMin?: string;
    heightMax?: string;
    hashkafa?: string[];
    hairColor?: string[];
    build?: string[];
    learningStatus?: string[];
    smoking?: string;
    notes?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  boy_profile_id: string;
  girl_profile_id: string;
  status: string;
  contacted_first: string;
  boy_response_notes: string;
  girl_response_notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  boy_profile?: Profile;
  girl_profile?: Profile;
  notes?: MatchNote[];
};

export type MatchNote = {
  id: string;
  match_id: string;
  author_id: string;
  note_text: string;
  note_type: string;
  is_private: boolean;
  created_at: string;
  author?: AppUser;
};

export type ScheduledDate = {
  id: string;
  match_id: string;
  date_time: string;
  location: string;
  date_number: number;
  notes: string;
  status: string;
  boy_feedback: string;
  girl_feedback: string;
  boy_wants_another: string;
  girl_wants_another: string;
  end_reason: string;
  created_by: string;
  created_at: string;
};

export type ProfileShare = {
  id: string;
  profile_id: string;
  shared_by: string;
  shared_with: string;
  can_edit: boolean;
  created_at: string;
  shared_with_user?: AppUser;
};

// ── Constants ──
export const HAIR_COLORS = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Red', 'Auburn', 'Gray'];
export const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Dark'];
export const EYE_COLORS = ['Brown', 'Hazel', 'Green', 'Blue', 'Gray'];
export const HASHKAFOS = ['Chassidish', 'Yeshivish', 'Modern Orthodox Machmir', 'Modern Orthodox', 'Modern Orthodox Liberal', 'Sephardi', 'Other'];
export const BUILDS = ['Slim', 'Average', 'Athletic', 'Heavy'];

export const MATCH_STATUSES = [
  'Suggested', 'Sent to Boy Side', 'Boy Said Yes', 'Boy Said No',
  'Sent to Girl Side', 'Girl Said Yes', 'Girl Said No',
  'Both Agreed', 'Dating', 'Engaged', 'Married', 'Ended',
];

export const MATCH_STATUS_FLOW: Record<string, string[]> = {
  'Suggested': ['Sent to Boy Side', 'Sent to Girl Side', 'Ended'],
  'Sent to Boy Side': ['Boy Said Yes', 'Boy Said No', 'Ended'],
  'Boy Said Yes': ['Sent to Girl Side', 'Ended'],
  'Boy Said No': ['Ended'],
  'Sent to Girl Side': ['Girl Said Yes', 'Girl Said No', 'Ended'],
  'Girl Said Yes': ['Both Agreed', 'Ended'],
  'Girl Said No': ['Ended'],
  'Both Agreed': ['Dating', 'Ended'],
  'Dating': ['Engaged', 'Ended'],
  'Engaged': ['Married', 'Ended'],
  'Married': [],
  'Ended': ['Suggested'],
};

export const STATUS_COLORS: Record<string, string> = {
  'Suggested': '#8B7355',
  'Sent to Boy Side': '#6B8E9B',
  'Boy Said Yes': '#7B8D6E',
  'Boy Said No': '#A0736C',
  'Sent to Girl Side': '#6B8E9B',
  'Girl Said Yes': '#7B8D6E',
  'Girl Said No': '#A0736C',
  'Both Agreed': '#5C8A5C',
  'Dating': '#C4956A',
  'Engaged': '#9B7CB8',
  'Married': '#5C8A5C',
  'Ended': '#A0736C',
};

export const DATE_FEEDBACK_OPTIONS = ['Yes', 'No', 'Maybe'];

export const HEIGHTS: string[] = [];
for (let f = 4; f <= 6; f++) for (let i = 0; i < 12; i++) { if (f === 6 && i > 6) break; HEIGHTS.push(`${f}'${i}"`); }

export const LEARNING_STATUSES = ['Full-time Learning', 'Part-time Learning', 'Working', 'Learning & Working', 'In School', 'Other'];
export const SMOKING_OPTIONS = ['No', 'Yes', 'Occasionally', 'Quit'];
export const POSITION_OPTIONS = ['Oldest', 'Middle', 'Youngest', 'Only Child'];
export const READY_OPTIONS = ['Yes', 'Not Yet', 'Starting Soon', 'On Hold'];
export const PERSONALITY_TRAITS = [
  'Outgoing', 'Quiet', 'Funny', 'Serious', 'Creative', 'Analytical',
  'Ambitious', 'Laid-back', 'Warm', 'Independent', 'Family-oriented',
  'Intellectual', 'Adventurous', 'Organized', 'Flexible', 'Caring',
  'Confident', 'Shy', 'Energetic', 'Calm',
];
export const LANGUAGES = ['English', 'Hebrew', 'Yiddish', 'French', 'Spanish', 'Russian', 'Farsi', 'Arabic', 'Other'];

export const SCHOOLS_GIRL = [
  { key: 'elementary', label: 'Elementary School' },
  { key: 'highSchool', label: 'High School / Bais Yaakov' },
  { key: 'seminary', label: 'Seminary' },
  { key: 'college', label: 'College / University' },
];
export const SCHOOLS_BOY = [
  { key: 'elementary', label: 'Elementary School' },
  { key: 'highSchool', label: 'Mesivta / High School' },
  { key: 'yeshiva', label: 'Yeshiva / Beis Medrash' },
  { key: 'college', label: 'College / University' },
];