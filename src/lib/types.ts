export type RiskLevel = 'Rendah' | 'Sedang' | 'Tinggi';

export type ProjectStatus = 'open' | 'funded' | 'running' | 'completed';

export type Project = {
  id: string;
  title: string;
  category: string;
  location: string;
  summary: string;
  description: string;
  imageUrl: string | null;
  targetAmount: number;
  raisedAmount: number;
  minInvestment: number;
  /** Estimasi imbal hasil per tahun, dalam persen. */
  expectedReturnPct: number;
  tenorMonths: number;
  riskLevel: RiskLevel;
  status: ProjectStatus;
  /** Batas akhir penerimaan minat investasi (ISO date). */
  closingDate: string | null;
  highlights: string[];
  prospectusUrl: string | null;
};

export type InvestmentStatus = 'pending' | 'contacted' | 'approved' | 'rejected' | 'cancelled';

export type Investment = {
  id: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  note: string;
  status: InvestmentStatus;
  createdAt: string;
};

export type InvestorContact = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  occupation: string;
};

/** Pengajuan dilihat dari panel admin, lengkap dengan data investornya. */
export type AdminInvestment = Investment & {
  updatedAt: string;
  investor: InvestorContact;
};

export type StatusChange = {
  id: string;
  fromStatus: InvestmentStatus | null;
  toStatus: InvestmentStatus;
  note: string;
  /** Email pengubah; kosong bila diubah lewat Supabase Dashboard. */
  changedBy: string;
  createdAt: string;
};

export type AdminProject = Project & { published: boolean };

export type ProjectInput = Omit<AdminProject, 'id'>;

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  occupation: string;
};

export type SessionUser = {
  id: string;
  email: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

export interface Backend {
  readonly mode: 'supabase' | 'demo';
  getUser(): Promise<SessionUser | null>;
  onAuthChange(cb: (user: SessionUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<{ needsEmailConfirmation: boolean }>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;

  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;

  submitInvestment(projectId: string, amount: number, note: string): Promise<void>;
  listMyInvestments(): Promise<Investment[]>;
  cancelInvestment(id: string): Promise<void>;

  getProfile(): Promise<Profile | null>;
  updateProfile(patch: Omit<Profile, 'id' | 'email'>): Promise<void>;

  /** Status admin selalu ditentukan server; tampilan admin di aplikasi hanya pelengkap. */
  isAdmin(): Promise<boolean>;
  adminListInvestments(): Promise<AdminInvestment[]>;
  adminGetInvestment(id: string): Promise<AdminInvestment | null>;
  adminInvestmentHistory(id: string): Promise<StatusChange[]>;
  adminSetInvestmentStatus(id: string, status: InvestmentStatus, note: string): Promise<void>;
  adminListProjects(): Promise<AdminProject[]>;
  adminGetProject(id: string): Promise<AdminProject | null>;
  /** Membuat proyek baru bila `id` null; mengembalikan id proyek. */
  adminSaveProject(id: string | null, input: ProjectInput): Promise<string>;
}
