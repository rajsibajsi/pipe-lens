# Manual Testing Checklist - Phase 2: Stage Preview

This checklist provides step-by-step instructions for manually testing the Pipeline Builder Stage Preview feature.

## Prerequisites

1. **MongoDB running** - Ensure Docker MongoDB is running:
   ```bash
   docker compose up -d
   ```

2. **Test data seeded** - Seed the test database:
   ```bash
   node tests/setup/seed-db.ts
   ```

3. **Servers running** - Start both servers:
   ```bash
   # Terminal 1 - API server
   cd apps/api && pnpm dev

   # Terminal 2 - Web server
   cd apps/web && pnpm dev
   ```

4. **Open browser** - Navigate to http://localhost:5173/builder

## Test Suite

### Test 1: UI Elements Display
**Objective**: Verify all pipeline builder UI elements are visible

**Steps**:
1. ✅ Verify "Pipeline Builder" heading is visible
2. ✅ Verify "Pipeline Stages" sidebar is visible
3. ✅ Verify stage buttons are visible: `$match`, `$group`, `$sort`, etc.
4. ✅ Verify "Connection" section is visible
5. ✅ Verify "Connect to MongoDB" button is visible
6. ✅ Verify Monaco Editor is visible with default pipeline
7. ✅ Verify "Save", "Run with Preview", and "Run Pipeline" buttons are visible

**Expected**: All UI elements should be visible and properly styled

---

### Test 2: Connection Modal
**Objective**: Verify connection modal opens and closes properly

**Steps**:
1. Click "Connect to MongoDB" button
2. ✅ Verify modal appears with:
   - "Connect to MongoDB" heading
   - "Connection Name" input field (pre-filled with "Local MongoDB")
   - "Connection URI" input field
   - "Connect" and "Cancel" buttons
3. Click "Cancel" button
4. ✅ Verify modal closes

**Expected**: Modal opens and closes without errors

---

### Test 3: MongoDB Connection
**Objective**: Connect to MongoDB and verify database/collection selection

**Steps**:
1. Click "Connect to MongoDB" button
2. In "Connection Name" field, enter: `Test Connection`
3. In "Connection URI" field, enter: `mongodb://admin:password@localhost:27017`
4. Click "Connect" button
5. ✅ Wait for modal to close (2-5 seconds)
6. ✅ Verify "Test Connection" appears in Connection section with green dot
7. ✅ Verify "Select database..." dropdown appears
8. Click "Select database..." dropdown
9. ✅ Verify "testdb" appears in dropdown
10. Click "testdb"
11. ✅ Verify "Select collection..." dropdown appears
12. Click "Select collection..." dropdown
13. ✅ Verify "orders" appears in dropdown

**Expected**: Connection succeeds and database/collection selectors work properly

---

### Test 4: Run Pipeline with Stage Preview
**Objective**: Execute pipeline with stage-by-stage preview

**Steps**:
1. Complete Test 3 to connect and select testdb.orders
2. In Monaco Editor, replace pipeline with:
   ```json
   [
     {
       "$match": {
         "status": "shipped"
       }
     },
     {
       "$group": {
         "_id": "$category",
         "count": { "$sum": 1 }
       }
     }
   ]
   ```
3. Click "Run with Preview" button (purple button)
4. ✅ Wait for results (2-5 seconds)
5. ✅ Verify "Stage-by-Stage Results" heading appears
6. ✅ Verify 2 stage cards appear:
   - Stage 1: `$match` with document count
   - Stage 2: `$group` with document count
7. Click on first stage card (`$match`)
8. ✅ Verify stage expands showing:
   - "Stage Definition" with JSON
   - "Preview" with sample documents
   - Execution time (e.g., "5ms")
9. ✅ Verify document counts make sense:
   - `$match` should show ~5 documents (shipped orders)
   - `$group` should show ~2-3 documents (categories)

**Expected**: Pipeline executes successfully with stage-by-stage results displayed

---

### Test 5: Toggle Between Result Modes
**Objective**: Verify switching between regular results and stage preview

**Steps**:
1. Complete Test 4 (stage preview should be visible)
2. In Monaco Editor, change pipeline to: `[{ "$limit": 5 }]`
3. Click "Run Pipeline" button (blue button)
4. ✅ Verify "Pipeline Results" heading appears
5. ✅ Verify 5 documents are displayed in JSON format
6. Click "Run with Preview" button
7. ✅ Verify "Stage-by-Stage Results" heading appears
8. ✅ Verify single stage card for `$limit` appears

**Expected**: UI correctly switches between regular results and stage preview modes

---

### Test 6: Execution Time Display
**Objective**: Verify execution time is shown for each stage

**Steps**:
1. Complete Test 3 to connect to testdb.orders
2. In Monaco Editor, enter this pipeline:
   ```json
   [
     { "$match": { "status": "shipped" } },
     { "$group": { "_id": "$category", "count": { "$sum": 1 } } },
     { "$sort": { "count": -1 } }
   ]
   ```
3. Click "Run with Preview" button
4. ✅ Verify 3 stage cards appear
5. For each stage card:
   - ✅ Verify execution time is displayed (e.g., "3ms", "0.02s")
   - ✅ Verify time format is either milliseconds (ms) or seconds (s)

**Expected**: Each stage shows execution time in proper format

---

### Test 7: Error Handling for Invalid Pipeline
**Objective**: Verify error messages for invalid pipelines

**Steps**:
1. Complete Test 3 to connect to testdb.orders
2. In Monaco Editor, enter invalid pipeline:
   ```json
   [{ "invalid": "operator" }]
   ```
3. Click "Run with Preview" button
4. ✅ Verify error message appears mentioning "invalid operators"
5. ✅ Verify no results are displayed

**Expected**: Clear error message displayed for invalid pipeline

---

### Test 8: Document Count Changes Across Stages
**Objective**: Verify document counts change appropriately through pipeline stages

**Steps**:
1. Complete Test 3 to connect to testdb.orders
2. In Monaco Editor, enter pipeline:
   ```json
   [
     { "$match": { "category": "Electronics" } },
     { "$limit": 2 }
   ]
   ```
3. Click "Run with Preview" button
4. ✅ Verify 2 stage cards appear
5. ✅ Verify `$match` stage shows 4 documents (Electronics items)
6. ✅ Verify `$limit` stage shows 2 documents
7. Click each stage card to expand
8. ✅ Verify preview shows correct number of documents

**Expected**: Document counts accurately reflect pipeline transformations

---

## Test Data Reference

The test database (`testdb.orders`) contains 8 orders:

| Product  | Category     | Status    | Quantity | Price |
|----------|--------------|-----------|----------|-------|
| Laptop   | Electronics  | shipped   | 1        | 1200  |
| Mouse    | Electronics  | shipped   | 3        | 25    |
| Desk     | Furniture    | pending   | 1        | 300   |
| Chair    | Furniture    | shipped   | 2        | 150   |
| Monitor  | Electronics  | shipped   | 1        | 400   |
| Keyboard | Electronics  | cancelled | 2        | 75    |
| Table    | Furniture    | shipped   | 1        | 250   |
| Lamp     | Furniture    | pending   | 3        | 45    |

**Useful aggregation queries**:
- `status: "shipped"` → 5 documents
- `category: "Electronics"` → 4 documents
- `category: "Furniture"` → 4 documents
- `status: "pending"` → 2 documents

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Modal doesn't open | Refresh page, check browser console for errors |
| Connection fails | Verify MongoDB is running: `docker compose ps` |
| No databases shown | Check connection string, verify MongoDB credentials |
| Tests timeout | Check API server is running on port 3001 |
| Stage results not displaying | Check browser console, verify API endpoint `/api/pipelines/execute-stages` |

## Success Criteria

All 8 tests should pass with:
- ✅ No JavaScript errors in browser console
- ✅ No API errors in server logs
- ✅ All UI elements functioning correctly
- ✅ Stage preview displaying accurate results
- ✅ Document counts matching expected values
- ✅ Execution times showing reasonable values (< 100ms for test data)

---

**Last Updated**: Phase 2 Implementation
**Test Database**: testdb.orders (8 documents)
**MongoDB**: Docker container on localhost:27017