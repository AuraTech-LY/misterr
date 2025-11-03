# Implementation Plan: Real-time Orders, Roles System, and Audit Logging

## Overview
Implement a comprehensive system with:
1. Real-time order updates using Supabase Realtime
2. Role-based access control (RBAC) with granular permissions
3. Immutable audit logging system

---

## Phase 1: Database Schema Design

### 1.1 Roles and Permissions Table
Create `user_roles` table with:
- User identification (email/phone)
- Boolean permissions for each action:
  - `can_view_orders`
  - `can_update_order_status`
  - `can_delete_orders`
  - `can_manage_menu_items`
  - `can_manage_categories`
  - `can_manage_restaurants`
  - `can_manage_branches`
  - `can_view_reports`
  - `can_manage_users` (assign/modify roles)
  - `is_owner` (super admin)
- Metadata (created_at, updated_at)

### 1.2 Audit Logs Table
Create `audit_logs` table with:
- Immutable records (no updates/deletes allowed)
- Log entry fields:
  - `id` (uuid, primary key)
  - `table_name` (which table was affected)
  - `record_id` (uuid/text, ID of affected record)
  - `action` (INSERT, UPDATE, DELETE, ROLE_CHANGE)
  - `old_data` (jsonb, previous state)
  - `new_data` (jsonb, new state)
  - `changed_by` (who made the change)
  - `changed_at` (timestamp, immutable)
  - `ip_address` (if available)
  - `user_agent` (if available)

### 1.3 Update Existing Tables
Add audit triggers to:
- `orders` and `order_items`
- `menu_items`
- `categories`
- `restaurants`
- `restaurant_branches`
- `user_roles` (log role changes)

---

## Phase 2: Database Implementation

### 2.1 Create Roles Table Migration
- Create `user_roles` table with all permission columns
- Enable RLS on `user_roles`
- Create policies:
  - Owners can view/manage all roles
  - Users can view their own role
  - Only owners can update roles

### 2.2 Create Audit Logs Table Migration
- Create `audit_logs` table (append-only)
- Enable RLS on `audit_logs`
- Create policies:
  - Only owners can view audit logs
  - System can insert (via triggers)
  - NO UPDATE or DELETE policies (immutable)

### 2.3 Create Audit Trigger Functions
- Create generic audit trigger function
- Apply triggers to all relevant tables
- Capture: operation type, old/new data, user info, timestamp

### 2.4 Update RLS Policies on Existing Tables
Modify existing RLS policies to check `user_roles`:
- `orders`: Check `can_view_orders`, `can_update_order_status`
- `menu_items`: Check `can_manage_menu_items`
- `categories`: Check `can_manage_categories`
- `restaurants`: Check `can_manage_restaurants`
- `restaurant_branches`: Check `can_manage_branches`

---

## Phase 3: Backend Services

### 3.1 Create Role Helper Functions
- `check_user_permission(user_email, permission_name)` - Returns boolean
- `get_user_role(user_email)` - Returns full role object
- `is_owner(user_email)` - Quick owner check

### 3.2 Create Audit Query Functions
- `get_audit_logs(table_name?, record_id?, date_range?)` - Query logs
- `get_recent_changes(limit)` - Get latest changes
- `get_user_activity(user_email)` - Track specific user actions

---

## Phase 4: Frontend Implementation

### 4.1 Real-time Orders Component (Cashier Interface)
Create `CashierOrdersView.tsx`:
- Subscribe to Supabase Realtime on `orders` table
- Display orders in real-time as they come in
- Filter by status (pending, confirmed, preparing, etc.)
- Update order status with permission check
- Sound/visual notification for new orders
- Auto-refresh on connection restore

### 4.2 User Management Component (Admin)
Create `AdminUserManagement.tsx`:
- List all users with roles
- Edit user permissions (checkboxes for each permission)
- Show role modification history
- Prevent owners from removing their own owner status
- Only visible to owners

### 4.3 Audit Logs Viewer Component (Admin)
Create `AdminAuditLogs.tsx`:
- Display audit logs with filters:
  - Table name
  - Action type
  - Date range
  - User who made change
- Show diff view (old vs new data)
- Export logs to CSV/JSON
- Only visible to owners

### 4.4 Permission Guard Hook
Create `usePermission.ts`:
- Check user permissions before rendering components
- Disable buttons/actions based on permissions
- Redirect unauthorized users

---

## Phase 5: Security Implementation

### 5.1 RLS Policy Security
- Use `auth.jwt()` to get user email
- Check `user_roles` table in all policies
- Ensure restrictive defaults (deny by default)
- Test all permission combinations

### 5.2 Audit Log Security
- Prevent DELETE/UPDATE on audit_logs table at database level
- Use triggers to enforce immutability
- Ensure audit logs capture even owner actions

### 5.3 Owner Protections
- Prevent last owner from being demoted
- Require at least one owner in system
- Log all owner role changes with extra scrutiny

---

## Phase 6: Testing & Validation

### 6.1 Permission Testing
- Test each permission independently
- Verify users without permissions are blocked
- Test owner can override all restrictions
- Test role modification logging

### 6.2 Real-time Testing
- Test WebSocket connection stability
- Test order updates across multiple clients
- Test reconnection handling
- Test with high order volume

### 6.3 Audit Log Testing
- Verify all changes are logged
- Confirm logs are immutable
- Test log queries and filters
- Verify no data leakage in logs

---

## Phase 7: UI/UX Polish

### 7.1 Cashier Interface
- Clean, focused order view
- Large, easy-to-read order cards
- Status update buttons with confirmation
- Order completion sound effects
- Responsive design for tablets

### 7.2 Admin Interfaces
- Intuitive permission management
- Clear visual indicators for permissions
- Audit log timeline view
- Real-time role change notifications

---

## Implementation Order (Step by Step)

1. Create `user_roles` table and RLS policies
2. Create `audit_logs` table and RLS policies
3. Create audit trigger function
4. Apply audit triggers to all tables
5. Create role helper functions (check_user_permission, etc.)
6. Update RLS policies on orders table to check permissions
7. Update RLS policies on menu_items table to check permissions
8. Update RLS policies on categories table to check permissions
9. Update RLS policies on restaurants table to check permissions
10. Update RLS policies on restaurant_branches table to check permissions
11. Create React hook for permission checking (usePermission)
12. Create AdminUserManagement component
13. Create AdminAuditLogs component
14. Create CashierOrdersView component with Realtime
15. Update AdminDashboard to integrate new components
16. Test all permissions and security
17. Build and deploy

---

## Security Best Practices Applied

✅ Row-Level Security (RLS) enabled on all tables
✅ Principle of least privilege (deny by default)
✅ Immutable audit logs (no delete/update)
✅ Owner protection (can't remove last owner)
✅ Permission checks at database level (not just frontend)
✅ All changes logged automatically via triggers
✅ Audit logs include who, what, when, and context
✅ Real-time updates secure via RLS policies

---

## Technologies Used

- **Supabase Realtime**: WebSocket-based real-time subscriptions
- **PostgreSQL RLS**: Row-level security for access control
- **PostgreSQL Triggers**: Automatic audit logging
- **React Hooks**: Custom permission checking
- **TypeScript**: Type-safe permission definitions
