# Farm Management System - Theme Consistency Guide

## Overview
This guide ensures consistent theming across all pages, forms, and components in the farming app. All components should follow these standardized patterns for a cohesive user experience.

## Core Theme System

### Color Palette
- **Primary**: Green theme for farming/agriculture (`--primary`)
- **Secondary**: Earth tones for supporting elements (`--secondary`)
- **Success**: Green for positive actions (`--success`)
- **Warning**: Yellow/amber for caution (`--warning`)
- **Destructive**: Red for errors/deletion (`--destructive`)
- **Info**: Blue for informational content (`--info`)

### Component Usage

#### 1. Page Structure
```tsx
import { PageContainer, PageHeader } from "@/components/ui/farm-theme";

export default function MyPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Page Title"
        description="Page description"
        icon={<span className="text-white text-2xl">🌱</span>}
        actions={
          <FarmButton variant="primary">
            <span className="mr-2">➕</span>
            Add New Item
          </FarmButton>
        }
      />
      {/* Page content */}
    </PageContainer>
  );
}
```

#### 2. Cards
```tsx
import { FarmCard, FarmCardHeader, FarmCardContent } from "@/components/ui/farm-theme";

// Standard card
<FarmCard>
  <FarmCardHeader 
    title="Card Title"
    description="Card description"
    badge={<FarmBadge variant="success">Active</FarmBadge>}
  />
  <FarmCardContent>
    {/* Card content */}
  </FarmCardContent>
</FarmCard>

// Interactive card (clickable)
<FarmCard interactive onClick={handleClick}>
  {/* Card content */}
</FarmCard>

// Metric card for dashboard
<FarmCard variant="metric">
  {/* Metric content */}
</FarmCard>
```

#### 3. Buttons
```tsx
import { FarmButton } from "@/components/ui/farm-theme";

// Primary action
<FarmButton variant="primary">Save Changes</FarmButton>

// Secondary action
<FarmButton variant="secondary">Cancel</FarmButton>

// Success action
<FarmButton variant="success">Complete Task</FarmButton>

// Warning action
<FarmButton variant="warning">Archive</FarmButton>

// Destructive action
<FarmButton variant="destructive">Delete</FarmButton>

// Outline style
<FarmButton variant="outline">View Details</FarmButton>

// Ghost style
<FarmButton variant="ghost">Edit</FarmButton>

// With loading state
<FarmButton variant="primary" loading={isLoading}>
  {isLoading ? "Saving..." : "Save"}
</FarmButton>
```

#### 4. Forms
```tsx
import { FarmForm, FarmFormGroup, FarmInput, FarmSelect, FarmTextarea } from "@/components/ui/farm-theme";

<FarmForm onSubmit={handleSubmit}>
  <FarmFormGroup label="Crop Name" required>
    <FarmInput
      type="text"
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
      placeholder="e.g., Tomatoes"
    />
  </FarmFormGroup>

  <FarmFormGroup label="Category">
    <FarmSelect
      value={formData.category}
      onChange={(e) => setFormData({...formData, category: e.target.value})}
    >
      <option value="">Select category</option>
      <option value="vegetables">Vegetables</option>
      <option value="fruits">Fruits</option>
    </FarmSelect>
  </FarmFormGroup>

  <FarmFormGroup label="Description">
    <FarmTextarea
      value={formData.description}
      onChange={(e) => setFormData({...formData, description: e.target.value})}
      placeholder="Enter description..."
    />
  </FarmFormGroup>

  <div className="flex gap-3">
    <FarmButton type="submit" variant="primary">Create Crop</FarmButton>
    <FarmButton type="button" variant="outline" onClick={onCancel}>Cancel</FarmButton>
  </div>
</FarmForm>
```

#### 5. Grids
```tsx
import { FarmGrid } from "@/components/ui/farm-theme";

// Responsive grid (1 col mobile, 2 tablet, 3 desktop)
<FarmGrid variant="responsive">
  {items.map(item => <FarmCard key={item.id}>...</FarmCard>)}
</FarmGrid>

// Metrics grid (1 col mobile, 2 tablet, 4 desktop)
<FarmGrid variant="metrics">
  {metrics.map(metric => <FarmCard variant="metric" key={metric.id}>...</FarmCard>)}
</FarmGrid>

// Auto-fit grid (responsive based on min width)
<FarmGrid variant="auto">
  {items.map(item => <FarmCard key={item.id}>...</FarmCard>)}
</FarmGrid>
```

#### 6. Status Badges
```tsx
import { FarmBadge } from "@/components/ui/farm-theme";

<FarmBadge variant="success">Active</FarmBadge>
<FarmBadge variant="warning">Pending</FarmBadge>
<FarmBadge variant="error">Failed</FarmBadge>
<FarmBadge variant="info">Processing</FarmBadge>
<FarmBadge variant="neutral">Draft</FarmBadge>
```

#### 7. Loading & Error States
```tsx
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/farm-theme";

// Loading state
if (loading) {
  return <LoadingState message="Loading your crops..." />;
}

// Error state
if (error) {
  return (
    <ErrorState
      title="Failed to load crops"
      message={error}
      onRetry={fetchCrops}
    />
  );
}

// Empty state
if (items.length === 0) {
  return (
    <EmptyState
      icon={<span className="text-3xl">🌱</span>}
      title="No crops found"
      description="Add your first crop to get started with farm management!"
      action={
        <FarmButton variant="primary" onClick={() => setShowCreateForm(true)}>
          <span className="mr-2">➕</span>
          Add Your First Crop
        </FarmButton>
      }
    />
  );
}
```

### Typography Classes
- `farm-heading-display`: Main page titles
- `farm-heading-page`: Page section titles
- `farm-heading-section`: Section headings
- `farm-heading-card`: Card titles
- `farm-text-body`: Regular body text
- `farm-text-muted`: Secondary/muted text
- `farm-text-caption`: Small caption text

### Animation Classes
- `farm-fade-in`: Fade in animation
- `farm-stagger-item`: Staggered animation for grid items

## Migration Checklist

### For Each Page:
1. ✅ Replace page container with `PageContainer`
2. ✅ Replace page header with `PageHeader` component
3. ✅ Replace custom cards with `FarmCard` components
4. ✅ Replace buttons with `FarmButton` components
5. ✅ Replace form elements with `FarmForm*` components
6. ✅ Replace grids with `FarmGrid` components
7. ✅ Replace badges with `FarmBadge` components
8. ✅ Update typography classes
9. ✅ Add consistent loading/error/empty states
10. ✅ Test dark mode compatibility

### Pages to Update:
- [ ] Dashboard (`/dashboard`)
- [ ] Crops (`/crops`)
- [ ] Tasks (`/tasks`)
- [ ] Fields (`/fields`)
- [ ] Weather (`/weather`)
- [ ] Planning (`/planning`)
- [ ] Settings (`/settings`)
- [ ] Profile (`/profile`)
- [ ] Reports (`/reports`)
- [ ] Activities (`/activities`)
- [ ] Soil Management (`/soil`)
- [ ] Land Preparation (`/land-preparation`)

### Components to Update:
- [ ] Navigation
- [ ] AI Chat Assistant
- [ ] Weather Dashboard
- [ ] Field Form
- [ ] Soil Analysis Dashboard
- [ ] All form components

## Best Practices

1. **Consistency**: Always use the theme components instead of custom styling
2. **Accessibility**: All components include proper ARIA labels and keyboard navigation
3. **Mobile-First**: All components are designed mobile-first with touch targets
4. **Dark Mode**: All components support dark mode automatically
5. **Performance**: Use the stagger animations sparingly for better performance
6. **Semantic HTML**: Use proper semantic elements within the theme components

## Color Usage Guidelines

### When to Use Each Color:
- **Primary (Green)**: Main actions, active states, farming-related content
- **Secondary**: Supporting actions, neutral states
- **Success**: Completed tasks, successful operations, healthy crops
- **Warning**: Pending tasks, caution states, overdue items
- **Destructive**: Delete actions, error states, failed operations
- **Info**: Informational content, tips, neutral notifications

### Status Color Mapping:
- **Crop Status**: Growing (success), Planted (info), Harvested (success), Failed (destructive)
- **Task Status**: Completed (success), In Progress (info), Overdue (warning), Cancelled (destructive)
- **Field Status**: Active (success), Inactive (neutral), Maintenance (warning)