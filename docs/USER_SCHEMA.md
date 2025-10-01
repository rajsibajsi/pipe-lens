# User and Pipeline Database Schema

## Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  avatar: String (optional),
  plan: String (enum: ['free', 'pro', 'enterprise'], default: 'free'),
  createdAt: Date (default: now),
  updatedAt: Date (default: now),
  lastLoginAt: Date (optional),
  isActive: Boolean (default: true),
  preferences: {
    theme: String (enum: ['light', 'dark', 'auto'], default: 'auto'),
    language: String (default: 'en'),
    notifications: {
      email: Boolean (default: true),
      pipelineUpdates: Boolean (default: true)
    }
  }
}
```

## Pipelines Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: 'users'),
  name: String (required),
  description: String (optional),
  tags: [String] (optional),
  pipeline: [Object] (required, MongoDB aggregation stages),
  connectionId: String (required),
  database: String (required),
  collection: String (required),
  sampleSize: Number (default: 10),
  isPublic: Boolean (default: false),
  isTemplate: Boolean (default: false),
  version: Number (default: 1),
  createdAt: Date (default: now),
  updatedAt: Date (default: now),
  lastExecutedAt: Date (optional),
  executionCount: Number (default: 0),
  metadata: {
    estimatedExecutionTime: Number (optional, in ms),
    complexity: String (enum: ['simple', 'medium', 'complex'], optional),
    category: String (optional),
    difficulty: String (enum: ['beginner', 'intermediate', 'advanced'], optional)
  }
}
```

## Pipeline Templates Collection

```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String (required),
  category: String (required),
  difficulty: String (enum: ['beginner', 'intermediate', 'advanced'], required),
  tags: [String] (required),
  pipeline: [Object] (required),
  isOfficial: Boolean (default: false),
  createdBy: ObjectId (ref: 'users', optional),
  createdAt: Date (default: now),
  updatedAt: Date (default: now),
  usageCount: Number (default: 0),
  rating: Number (min: 0, max: 5, optional),
  metadata: {
    estimatedExecutionTime: Number (optional),
    complexity: String (optional),
    useCases: [String] (optional),
    prerequisites: [String] (optional)
  }
}
```

## User Sessions Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: 'users'),
  token: String (required, unique),
  refreshToken: String (required, unique),
  expiresAt: Date (required),
  createdAt: Date (default: now),
  lastUsedAt: Date (default: now),
  userAgent: String (optional),
  ipAddress: String (optional),
  isActive: Boolean (default: true)
}
```

## Indexes

### Users Collection
- `{ email: 1 }` (unique)
- `{ createdAt: -1 }`
- `{ isActive: 1 }`

### Pipelines Collection
- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, name: 1 }` (unique)
- `{ isPublic: 1, createdAt: -1 }`
- `{ tags: 1 }`
- `{ isTemplate: 1, category: 1 }`
- `{ "metadata.category": 1 }`

### Pipeline Templates Collection
- `{ category: 1, difficulty: 1 }`
- `{ tags: 1 }`
- `{ isOfficial: 1, createdAt: -1 }`
- `{ usageCount: -1 }`
- `{ rating: -1 }`

### User Sessions Collection
- `{ token: 1 }` (unique)
- `{ refreshToken: 1 }` (unique)
- `{ userId: 1, isActive: 1 }`
- `{ expiresAt: 1 }` (TTL index)

## Validation Rules

### Users
- Email must be valid email format
- Password must be at least 8 characters
- Name must be at least 2 characters
- Plan must be one of the allowed values

### Pipelines
- Name must be unique per user
- Pipeline must be a valid array of MongoDB aggregation stages
- ConnectionId, database, and collection must be non-empty strings
- SampleSize must be between 1 and 1000
- Tags must be an array of strings (max 10 tags)

### Pipeline Templates
- Name must be unique
- Category must be one of predefined categories
- Difficulty must be one of allowed values
- Pipeline must be valid aggregation stages
- Rating must be between 0 and 5 if provided

## Data Relationships

- User has many Pipelines (one-to-many)
- User has many Sessions (one-to-many)
- Pipeline belongs to User (many-to-one)
- Pipeline can be based on Template (many-to-one, optional)
- Template can be created by User (many-to-one, optional)
