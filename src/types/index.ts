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

// Weather and Environmental Types
export interface WeatherData {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  description: string;
  icon: string;
  timestamp: Date;
}

export interface WeatherForecast {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  forecastDate: Date;
  tempMin: number;
  tempMax: number;
  humidity: number;
  precipitation: number;
  precipitationChance: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  timestamp: Date;
}

export interface WeatherAlert {
  id: string;
  userId: string;
  alertType: WeatherAlertType;
  severity: WeatherAlertSeverity;
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum WeatherAlertType {
  FROST = "FROST",
  STORM = "STORM",
  DROUGHT = "DROUGHT",
  FLOOD = "FLOOD",
  HIGH_WIND = "HIGH_WIND",
  EXTREME_HEAT = "EXTREME_HEAT",
  EXTREME_COLD = "EXTREME_COLD",
  HAIL = "HAIL",
}

export enum WeatherAlertSeverity {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  SEVERE = "SEVERE",
  EXTREME = "EXTREME",
}

// Growing Degree Days calculation
export interface GrowingDegreeDays {
  cropId: string;
  cropName: string;
  baseTemperature: number;
  accumulatedGDD: number;
  dailyGDD: number;
  date: Date;
}

// Evapotranspiration data
export interface EvapotranspirationData {
  cropId: string;
  cropName: string;
  referenceET: number;
  cropCoefficient: number;
  cropET: number;
  irrigationNeed: number;
  date: Date;
}

// Soil Management Types
export interface SoilTest {
  id: string;
  userId: string;
  cropId?: string;
  fieldId?: string;
  sampleDate: Date;
  labName: string;
  testType: SoilTestType;
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  sulfur: number;
  cationExchangeCapacity: number;
  soilTexture: string;
  recommendations: string;
  cost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum SoilTestType {
  BASIC = "BASIC",
  COMPREHENSIVE = "COMPREHENSIVE",
  MICRONUTRIENT = "MICRONUTRIENT",
  ORGANIC_MATTER = "ORGANIC_MATTER",
  HEAVY_METALS = "HEAVY_METALS",
}

export interface SoilAmendment {
  id: string;
  userId: string;
  cropId?: string;
  fieldId?: string;
  amendmentType: string;
  applicationDate: Date;
  rate: number;
  unit: string;
  cost: number;
  supplier?: string;
  method: string;
  notes?: string;
  createdAt: Date;
}

// Cost Tracking Enhancement Types
export interface CostCategory {
  id: string;
  userId: string;
  name: string;
  description?: string;
  categoryType: CostCategoryType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum CostCategoryType {
  VARIABLE = "VARIABLE",
  FIXED = "FIXED",
  SEMI_VARIABLE = "SEMI_VARIABLE",
}

export interface CostEntry {
  id: string;
  userId: string;
  cropId?: string;
  fieldId?: string;
  categoryId: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  supplier?: string;
  invoiceNumber?: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

// Field and Location Types
export interface Field {
  id: string;
  userId: string;
  name: string;
  description?: string;
  area: number;
  unit: string;
  location?: FieldLocation;
  soilType?: string;
  drainageType?: string;
  irrigationType?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldLocation {
  latitude: number;
  longitude: number;
  address?: string;
  boundaries?: GeoPoint[];
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

// Pre-Season Planning Types
export interface PreSeasonPlan {
  id: string;
  userId: string;
  season: string;
  year: number;
  status: PlanStatus;
  totalBudget: number;
  expectedRevenue: number;
  riskAssessment: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PlanStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  APPROVED = "APPROVED",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export interface PlannedCrop {
  id: string;
  planId: string;
  cropName: string;
  variety?: string;
  fieldId?: string;
  plannedArea: number;
  expectedYield: number;
  plannedPlantingDate: Date;
  plannedHarvestDate: Date;
  estimatedCosts: number;
  estimatedRevenue: number;
  notes?: string;
  createdAt: Date;
}

// Land Preparation Types
export interface TillageOperation {
  id: string;
  userId: string;
  fieldId?: string;
  cropId?: string;
  operationType: TillageType;
  operationDate: Date;
  depth: number;
  speed: number;
  equipment: string;
  operator?: string;
  fuelUsed: number;
  cost: number;
  soilConditions: string;
  notes?: string;
  createdAt: Date;
}

export enum TillageType {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
  CULTIVATION = "CULTIVATION",
  SUBSOILING = "SUBSOILING",
  DISKING = "DISKING",
  PLOWING = "PLOWING",
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
