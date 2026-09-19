# Common Components Library

A comprehensive collection of reusable React components following the Zoho-inspired design system.

## Components Overview

### Core Components
- **Button** - Versatile button with variants and loading states
- **Badge** - Status indicators and labels
- **Alert** - User notifications and messages

### Layout Components
- **Card** - Content containers with header, body, and footer
- **Modal** - Dialog component with backdrop

### Form Components
- **Input** - Text input with label and validation
- **Textarea** - Multi-line text input
- **Select** - Dropdown selector

### Feedback Components
- **Spinner** - Loading indicator
- **Skeleton** - Content placeholder for loading states
- **StateMessage** - Empty states and info messages
- **Pagination** - Page navigation

## Usage Examples

### Button
```jsx
import { Button } from '@/components/common'

<Button variant="primary" loading={saving}>
  Save Changes
</Button>
```

### Form with Validation
```jsx
import { Input, Button } from '@/components/common'

<form onSubmit={handleSubmit}>
  <Input
    label="Email"
    type="email"
    error={errors.email}
    required
  />
  <Button type="submit" fullWidth>Submit</Button>
</form>
```

### Card Layout
```jsx
import { Card, CardHeader, CardTitle, CardBody } from '@/components/common'

<Card hover>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardBody>Content here</CardBody>
</Card>
```

## Design System

All components follow the design system defined in `styles.css`:
- Primary color: Blue (#3b82f6)
- Neutral grays for text and borders
- Semantic colors: success, warning, error, info
- Consistent spacing and typography
