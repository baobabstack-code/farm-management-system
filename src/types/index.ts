import {
  Crop as PrismaCrop,
  Task as PrismaTask,
  IrrigationLog as PrismaIrrigationLog,
  FertilizerLog as PrismaFertilizerLog,
  PestDiseaseLog as PrismaPestDiseaseLog,
  HarvestLog as PrismaHarvestLog,
  CropStatus,
  TaskPriority,
  TaskCategory,
  TaskStatus,
  PestDiseaseType,
  Severity,
  IrrigationMethod,
  ApplicationMethod,
  QualityGrade,
} from "@prisma/client";

// Note: User management is handled by Clerk

// Crop types
export interface Crop extends PrismaCrop {
  id: string;
  userId: string;
  name: string;
  variety: string | null;
  plantingDate: Date;
  expectedHarvestDate: Date;
  actualHarvestDate: Date | null;
  status: CropStatus;
  area: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CropWithRelations extends Crop {
  tasks: Task[];
  irrigationLogs: IrrigationLog[];
  fertilizerLogs: FertilizerLog[];
  pestDiseaseLogs: PestDiseaseLog[];
  harvestLogs: HarvestLog[];
}

// Task types
export interface Task extends PrismaTask {
  id: string;
  userId: string;
  cropId: string | null;
  title: string;
  description: string | null;
  dueDate: Date;
  completedAt: Date | null;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskWithRelations extends Task {
  crop: Crop | null;
}

// Activity log types
export interface IrrigationLog extends PrismaIrrigationLog {
  id: string;
  userId: string;
  cropId: string;
  date: Date;
  duration: number;
  waterAmount: number;
  method: IrrigationMethod;
  notes: string | null;
  createdAt: Date;
}

export interface IrrigationLogWithRelations extends IrrigationLog {
  crop: Crop;
}

export interface FertilizerLog extends PrismaFertilizerLog {
  id: string;
  userId: string;
  cropId: string;
  date: Date;
  fertilizerType: string;
  amount: number;
  applicationMethod: ApplicationMethod;
  notes: string | null;
  createdAt: Date;
}

export interface FertilizerLogWithRelations extends FertilizerLog {
  crop: Crop;
}

export interface PestDiseaseLog extends PrismaPestDiseaseLog {
  id: string;
  userId: string;
  cropId: string;
  date: Date;
  type: PestDiseaseType;
  name: string;
  severity: Severity;
  affectedArea: number;
  treatment: string;
  notes: string | null;
  createdAt: Date;
}

export interface PestDiseaseLogWithRelations extends PestDiseaseLog {
  crop: Crop;
}

export interface HarvestLog extends PrismaHarvestLog {
  id: string;
  userId: string;
  cropId: string;
  harvestDate: Date;
  quantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  notes: string | null;
  createdAt: Date;
}

export interface HarvestLogWithRelations extends HarvestLog {
  crop: Crop;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard and Analytics types
export interface DashboardStats {
  totalCrops: number;
  activeTasks: number;
  overdueTasks: number;
  recentHarvests: number;
  totalYield: number;
  waterUsage: number;
}

export interface CropAnalytics {
  cropId: string;
  cropName: string;
  totalYield: number;
  averageYield: number;
  waterUsage: number;
  fertilizerUsage: number;
  pestIssues: number;
  diseaseIssues: number;
}

export interface YieldTrend {
  date: string;
  yield: number;
  cropName: string;
}

export interface ResourceUsage {
  date: string;
  waterUsage: number;
  fertilizerUsage: number;
}

// Export Prisma enums for convenience
export {
  CropStatus,
  TaskPriority,
  TaskCategory,
  TaskStatus,
  PestDiseaseType,
  Severity,
  IrrigationMethod,
  ApplicationMethod,
  QualityGrade,
};
