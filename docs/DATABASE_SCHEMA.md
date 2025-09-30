# Database Schema

MongoDB database schema for PipeLens application.

## Collections

### users
Stores user account information.

```typescript
{
  _id: ObjectId,
  email: string,              // Unique, indexed
  name: string,
  passwordHash?: string,      // For email/password auth
  googleId?: string,          // For Google OAuth
  tier: 'community' | 'premium' | 'enterprise',
  stripeCustomerId?: string,  // For Stripe integration
  subscriptionId?: string,
  subscriptionStatus?: 'active' | 'canceled' | 'past_due',
  trialEndsAt?: Date,
  createdAt: Date,            // Indexed
  updatedAt: Date,
  lastLoginAt?: Date
}
```

**Indexes:**
- `email` (unique)
- `createdAt` (descending)
- `googleId` (sparse, unique)

---

### pipelines
Stores saved aggregation pipelines.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to users collection, indexed
  name: string,
  description?: string,
  tags: string[],
  pipeline: object[],         // MongoDB aggregation pipeline array
  database: string,           // Target database name
  collection: string,         // Target collection name
  version: number,            // Version number for tracking changes
  isPublic: boolean,          // Whether pipeline is shared publicly (premium)
  forkCount: number,          // Number of times forked (premium)
  starCount: number,          // Number of stars (premium)
  createdAt: Date,            // Indexed
  updatedAt: Date
}
```

**Indexes:**
- `userId` (ascending)
- `createdAt` (descending)
- `tags` (multi-key)
- `userId + createdAt` (compound, for efficient user queries)

**Community Tier Limits:**
- Maximum 3 pipelines per user
- `isPublic` always false

---

### connections
Stores MongoDB connection configurations.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,           // Reference to users collection, indexed
  name: string,
  description?: string,
  connectionString: string,   // Encrypted at rest
  database?: string,          // Default database
  isDefault: boolean,
  isFavorite: boolean,
  lastUsedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` (ascending)
- `userId + isDefault` (compound, for finding default connection)

**Community Tier Limits:**
- Maximum 1 connection per user
- Local/network connections only (no Atlas)

---

### pipeline_history (Premium)
Version history for pipelines.

```typescript
{
  _id: ObjectId,
  pipelineId: ObjectId,       // Reference to pipelines collection, indexed
  userId: ObjectId,           // Reference to users collection
  version: number,
  pipeline: object[],
  changeDescription?: string,
  createdAt: Date             // Indexed
}
```

**Indexes:**
- `pipelineId + version` (compound, unique)
- `createdAt` (descending)

---

### teams (Premium)
Team/workspace information.

```typescript
{
  _id: ObjectId,
  name: string,
  slug: string,               // Unique, URL-friendly identifier
  ownerId: ObjectId,          // Reference to users collection
  members: [{
    userId: ObjectId,
    role: 'admin' | 'editor' | 'viewer',
    joinedAt: Date
  }],
  stripeSubscriptionId: string,
  subscriptionStatus: 'active' | 'canceled' | 'past_due',
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `slug` (unique)
- `ownerId`
- `members.userId` (multi-key)

---

### team_pipelines (Premium)
Shared pipelines within teams.

```typescript
{
  _id: ObjectId,
  teamId: ObjectId,           // Reference to teams collection, indexed
  pipelineId: ObjectId,       // Reference to pipelines collection
  sharedBy: ObjectId,         // User who shared it
  permissions: {
    canEdit: boolean,
    canDelete: boolean
  },
  sharedAt: Date,
  lastAccessedAt?: Date
}
```

**Indexes:**
- `teamId + pipelineId` (compound, unique)
- `pipelineId`

---

### pipeline_comments (Premium)
Comments on pipelines for collaboration.

```typescript
{
  _id: ObjectId,
  pipelineId: ObjectId,       // Reference to pipelines collection, indexed
  userId: ObjectId,           // Reference to users collection
  stageIndex?: number,        // Which stage the comment refers to
  content: string,
  mentions: ObjectId[],       // Users mentioned in comment
  isResolved: boolean,
  createdAt: Date,            // Indexed
  updatedAt: Date
}
```

**Indexes:**
- `pipelineId + createdAt` (compound)
- `userId`

---

## Quota Tracking

For community tier limits, we'll use a combination of:
1. Document counts with indexed queries
2. In-memory caching in the backend

Example quota check:
```javascript
// Check pipeline count for user
const pipelineCount = await db.pipelines.countDocuments({ userId });
if (user.tier === 'community' && pipelineCount >= 3) {
  throw new Error('Community tier limited to 3 pipelines');
}
```

---

## Migration Strategy

1. **Phase 0-1:** Implement `users`, `pipelines`, `connections`
2. **Phase 5:** Add authentication fields to `users`
3. **Phase 7:** Add premium fields and `pipeline_history`
4. **Phase 9:** Add `teams`, `team_pipelines`, `pipeline_comments`

All migrations will be tracked using a `migrations` collection:

```typescript
{
  _id: ObjectId,
  version: number,
  name: string,
  appliedAt: Date
}
```