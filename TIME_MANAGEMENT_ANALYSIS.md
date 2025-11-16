# Time Management System Analysis & Fix Plan

## Current Issues

### 1. **Branch ID Resolution Problem**
- BranchMenuPage loads Albaron by `slug='albaron'` which returns a restaurant with branches
- Then uses `branches[0].id` but we don't know what UUID this is
- Header and MenuItem receive `selectedBranch?.id` which might be undefined or wrong

### 2. **Components Checking Operating Hours**
The following components check `isWithinOperatingHours()`:
- **Header.tsx** - Line 91: Uses `selectedBranch?.id`
- **MenuItem.tsx** - Line 58: Uses `branchId` prop
- **CheckoutForm.tsx** - Likely checks operating hours
- **BranchMenuPage.tsx** - Line 165: Displays operating hours text

### 3. **Database Query Issues**
All queries to `branch_operating_hours` require:
- Correct `branch_id` (UUID)
- Correct `day_of_week` (0-6)

If either is wrong, query returns no results and defaults to "open".

### 4. **The Core Problem**
When you set "closed" in admin for Albaron:
- You're editing a specific branch's hours for a specific day
- But the client might be using a DIFFERENT branch ID
- Or the day_of_week calculation might be wrong

## Files That Need Review & Fix

### Critical Files:
1. **src/utils/timeUtils.ts** ✓ Already simplified
   - Query: `branch_operating_hours` by branch_id + day_of_week
   - Returns: is_closed, is_24_hours, opening_time, closing_time

2. **src/pages/BranchMenuPage.tsx**
   - Line 53: `getRestaurantBySlug('albaron')`
   - Line 56: Uses `branches[0].id`
   - Line 165: Fetches operating hours
   - **Issue**: Need to log which branch ID is actually being used

3. **src/components/Header.tsx**
   - Line 91: `isWithinOperatingHours(selectedBranch?.id)`
   - **Issue**: If `selectedBranch?.id` is undefined, it uses default hours

4. **src/components/MenuItem.tsx**
   - Line 58: `isWithinOperatingHours(branchId)`
   - **Issue**: If branchId is undefined, uses default hours

### Admin Files (For Reference):
- **AdminBranchOperatingHours.tsx** - Sets hours per branch per day
- Query: Shows which branch you're editing

## Fix Plan

### Step 1: Add Debug Logging
Add console logs to trace:
- Which branch ID BranchMenuPage is loading
- Which branch ID Header receives
- Which branch ID MenuItem receives
- What day_of_week is being calculated
- What the database query returns

### Step 2: Ensure Consistent Branch ID
- Make sure BranchMenuPage passes the correct branch ID to Header and Menu components
- Verify the branch ID matches what's in the database

### Step 3: Fix Default Behavior
Current: If no data found, assumes "open"
Should: If no data found, assume "closed" or show error

### Step 4: Test Flow
1. Admin: Set Albaron branch to "closed" for today
2. Note the branch ID and day_of_week
3. Client: Load page and verify it checks the SAME branch ID + day
4. Verify it shows "closed"

## Database Schema
```sql
branch_operating_hours (
  id uuid PRIMARY KEY,
  branch_id uuid REFERENCES restaurant_branches(id),
  day_of_week integer (0=Sunday, 6=Saturday),
  opening_time time,
  closing_time time,
  is_closed boolean,
  is_24_hours boolean
)
```

## Next Actions
1. Add comprehensive logging
2. Test with actual Albaron branch ID
3. Fix any mismatches
4. Remove debug logs after confirmed working
