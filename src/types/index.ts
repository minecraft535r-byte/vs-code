export interface Payment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  academicYear?: string;
  receiptNo?: number | string;
  receiptNumber?: string;
  schoolYear?: string;
  isWithdrawn?: boolean;
  withdrawDate?: string;
  withdrawReason?: string;
  withdrawNote?: string;
}

export interface PreviousDebt {
  id: string;
  year: string;
  amount: number;
  paid?: number;
  notes?: string;
  isPaying?: boolean;
}

export interface Student {
  id: string;
  name: string;
  school: string;
  grade: string;
  section?: string;
  phone: string;
  guardianPhone?: string;
  motherPhone?: string;
  tuition: number;
  discount: number;
  payments: Payment[];
  previousGrade?: string;
  previousDebt?: number;
  previousDebts?: PreviousDebt[];
  notes?: string;
  date?: string;
  subjects?: Record<string, number>;
  studentGrades?: any[];
  attendance?: any;
}

export interface Employee {
  id: string;
  name: string;
  school: string;
  jobTitle: string;
  subject?: string;
  phone: string;
  salary: number;
  dateJoined?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  school: string;
  type: string;
  source: string;
  date: string;
  amount: number;
  receiver: string;
  notes: string;
  status: "pending" | "paid";
  paymentDate?: string;
  receiptNo?: number;
  academicYear?: string;
}

export interface AdditionalRevenue {
  id: string;
  title: string;
  school: string;
  payer: string;
  amount: number;
  date: string;
  notes: string;
  status: "pending" | "received";
  receivedDate?: string;
  receiptNo?: number;
  academicYear?: string;
}

export interface Investor {
  id: string;
  name: string;
  percentage: number;
  payments?: {
    id: string;
    amount: number;
    date: string;
    notes?: string;
    receiptNo?: number | string;
  }[];
}

export interface AppUser {
  id: string;
  fullname: string;
  username: string;
  password: string;
  permissions: string[];
  allowedSchools: string[];
  notes: string;
  linkedSchool?: string;
  schoolPicture?: string | null;
  displayName?: string;
  profilePicture?: string;
  createdBy?: "superadmin" | "school";
  createdByUsername?: string;
  isActive?: boolean;
  expiresAt?: string;
  subscriptionPlan?: "monthly" | "yearly";
  activatedAt?: string;
  deactivatedAt?: string;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: "info" | "warning" | "success";
  read?: boolean;
  date?: string;
  time?: string;
  timestamp?: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface PrintSettings {
  receiptSize?: string;
  statementSize?: string;
  reportSize?: string;
}

export interface PaperSpec {
  width: string;
  height?: string;
  margin?: string;
  w?: number;
  h?: number;
  padding?: string;
  fontSize?: string;
  titleSize?: string;
  bodyFS?: string;
  bannerFS?: string;
  headerFS?: string;
  footerFS?: string;
  tableFS?: string;
  logoSize?: number;
  label?: string;
  compact?: boolean;
  [key: string]: any;
}

export interface PrintCol {
  key: string;
  label: string;
  width?: string;
  align?: string;
  render?: (val: any, row: any) => any;
}

export interface PrintTotals {
  [key: string]: number | string;
}

export interface SystemSettings {
  schoolName: string;
  schoolLogo: string | null;
  academicYear: string;
  address: string;
  lat?: number;
  lng?: number;
  gradePrices?: Record<string, number>;
  investors?: Investor[];
  sections?: string[];
  printSettings?: PrintSettings;
  [key: string]: any;
}

export interface DashboardTile {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  view: string;
}

export interface Permission {
  id: string;
  label: string;
  description: string;
}

export interface Grade {
  name: string;
  price?: number;
  score?: number;
  subject?: string;
}

export type Toast = {
  message: string;
  type: "success" | "error" | "warning" | "info";
};
