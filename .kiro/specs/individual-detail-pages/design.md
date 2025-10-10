# Design Document

## Overview

This design document outlines the implementation of comprehensive individual detail pages for the farming app to complete CRUD operations. The solution builds upon the existing farm-theme component system and follows established patterns from the current codebase. The design focuses on creating consistent, user-friendly detail views for crops, fields, and equipment while implementing missing functionality like proper delete operations and activity timelines.

## Architecture

### Component Architecture

The detail pages will follow a consistent architectural pattern:

```
DetailPage Component
├── PageContainer (farm-theme wrapper)
├── PageHeader (title, breadcrumbs, actions)
├── AlertBanner (maintenance alerts, warnings)
├── TabNavigation (overview, history, related data)
└── TabContent
    ├── OverviewTab (main information cards)
    ├── HistoryTab (activity timeline)
    └── RelatedDataTab (associated entities)
```

### Data Flow Architecture

```
User Action → Component State → API Call → Database → Response → UI Update
```

The architecture leverages:
- **Client-side state management** using React hooks
- **API routes** following existing `/api/{entity}/{id}` pattern
- **Optimistic updates** for better user experience
- **Error boundaries** for graceful error handling

### Navigation Architecture

```
List Page → Detail Page → Edit Page
     ↑         ↓           ↓
     └─── Delete Action ←──┘
```

## Components and Interfaces

### Core Components

#### DetailPageLayout
```typescript
interface DetailPageLayoutProps {
  entity: 'crop' | 'field' | 'equipment';
  title: string;
  subtitle?: string;
  icon: React.ComponentType;
  actions: React.ReactNode;
  alerts?: AlertConfig[];
  tabs: TabConfig[];
  children: React.ReactNode;
}
```

#### EntityDetailCard
```typescript
interface EntityDetailCardProps {
  title: string;
  data: Record<string, any>;
  formatters?: Record<string, (value: any) => string>;
  badges?: Record<string, BadgeConfig>;
}
```

#### ActivityTimeline
```typescript
interface ActivityTimelineProps {
  activities: Activity[];
  entityType: string;
  entityId: string;
}

interface Activity {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'status_change' | 'custom';
  timestamp: string;
  description: string;
  user?: string;
  metadata?: Record<string, any>;
}
```

#### DeleteConfirmationDialog
```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  entityName: string;
  entityType: string;
  onConfirm: () => void;
  onCancel: () => void;
  dependencies?: string[];
}
```

### Data Models

#### Enhanced Crop Interface
```typescript
interface CropDetail extends Crop {
  field?: Field;
  activities: Activity[];
  treatments: Treatment[];
  harvestRecords: HarvestRecord[];
  images?: ImageRecord[];
  dependencies: {
    tasks: number;
    treatments: number;
    harvests: number;
  };
}
```

#### Enhanced Field Interface
```typescript
interface FieldDetail extends Field {
  crops: Crop[];
  activities: Activity[];
  treatments: Treatment[];
  soilTests: SoilTest[];
  weatherData?: WeatherSummary;
  dependencies: {
    crops: number;
    treatments: number;
    equipment: number;
  };
}
```

#### Enhanced Equipment Interface
```typescript
interface EquipmentDetail extends Equipment {
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  usageHistory: UsageRecord[];
  activities: Activity[];
  dependencies: {
    operations: number;
    maintenance: number;
    fuel: number;
  };
}
```

## Error Handling

### Error Boundary Strategy

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class DetailPageErrorBoundary extends Component<Props, ErrorBoundaryState> {
  // Catches JavaScript errors anywhere in child component tree
  // Provides fallback UI with retry functionality
  // Logs errors for debugging
}
```

### API Error Handling

```typescript
interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

const handleApiError = (error: ApiError) => {
  switch (error.status) {
    case 404: return "Entity not found";
    case 403: return "Access denied";
    case 409: return "Cannot delete - has dependencies";
    default: return "An unexpected error occurred";
  }
};
```

### Dependency Validation

Before allowing deletion, the system will check for dependencies:

```typescript
interface DependencyCheck {
  canDelete: boolean;
  dependencies: {
    entity: string;
    count: number;
    blocking: boolean;
  }[];
  warnings: string[];
}
```

## Testing Strategy

### Unit Testing

**Component Testing:**
- Render tests for all detail page components
- Props validation and default behavior
- Event handler functionality
- Error state rendering

**Hook Testing:**
- Custom hooks for data fetching
- State management logic
- Error handling scenarios

**Utility Testing:**
- Data formatting functions
- Validation logic
- API response parsing

### Integration Testing

**API Integration:**
- CRUD operations for each entity type
- Error response handling
- Authentication and authorization
- Dependency checking

**Navigation Testing:**
- Route transitions between list/detail/edit pages
- Breadcrumb functionality
- Back button behavior

**User Flow Testing:**
- Complete CRUD workflows
- Delete confirmation flows
- Error recovery scenarios

### End-to-End Testing

**Critical User Journeys:**
1. View crop details → Edit crop → Save changes
2. View field details → Delete field (with/without dependencies)
3. View equipment details → Navigate to maintenance logs
4. Navigate between related entities (crop → field → equipment)

**Cross-browser Testing:**
- Chrome, Firefox, Safari, Edge
- Mobile responsive behavior
- Touch interaction testing

## Implementation Phases

### Phase 1: Core Detail Pages
- Create missing crop detail page (`/crops/[id]/page.tsx`)
- Create missing field detail page (`/fields/[id]/page.tsx`)
- Enhance existing equipment detail page
- Implement consistent layout and navigation

### Phase 2: Delete Operations
- Add delete functionality to all detail pages
- Implement dependency checking
- Create confirmation dialogs
- Add proper error handling

### Phase 3: Activity Timelines
- Design activity tracking system
- Implement timeline components
- Add activity logging to existing operations
- Create activity API endpoints

### Phase 4: Enhanced Features
- Add quick actions sidebar
- Implement related entity navigation
- Add image galleries where applicable
- Optimize performance and loading states

## Security Considerations

### Authentication & Authorization
- Verify user ownership of entities before display
- Implement role-based access control for delete operations
- Validate user permissions for each action

### Data Validation
- Sanitize all user inputs
- Validate entity IDs and relationships
- Prevent unauthorized data access

### Audit Trail
- Log all delete operations
- Track user actions for compliance
- Maintain data integrity during operations

## Performance Considerations

### Data Loading Strategy
- Implement progressive loading for large datasets
- Use pagination for activity timelines
- Cache frequently accessed data
- Optimize API queries with selective field loading

### Component Optimization
- Implement React.memo for expensive components
- Use useMemo for computed values
- Lazy load non-critical components
- Optimize re-renders with useCallback

### Bundle Optimization
- Code splitting for detail page routes
- Lazy loading of heavy components
- Optimize image loading and display
- Minimize JavaScript bundle size

## Accessibility

### WCAG 2.1 Compliance
- Proper heading hierarchy (h1 → h2 → h3)
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### Interactive Elements
- Focus management for modals and dialogs
- ARIA labels for complex components
- Keyboard shortcuts for common actions
- Touch-friendly button sizes

### Content Structure
- Semantic HTML elements
- Descriptive link text
- Alternative text for images
- Clear error messages