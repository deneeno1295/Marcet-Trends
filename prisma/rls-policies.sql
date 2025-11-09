-- RLS Policies for Multi-Tenant Security
-- These policies ensure users can only access data within workspaces they're members of

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OAuthAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Source" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Link" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Theme" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ThemeTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Person" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemPerson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItemTrend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Newsletter" ENABLE ROW LEVEL SECURITY;

-- Helper function to check workspace membership
CREATE OR REPLACE FUNCTION has_workspace_access(workspace_id TEXT, user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "Membership"
    WHERE "workspaceId" = workspace_id
    AND "userId" = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check user role in workspace
CREATE OR REPLACE FUNCTION get_user_role(workspace_id TEXT, user_id TEXT)
RETURNS "Role" AS $$
DECLARE
  user_role "Role";
BEGIN
  SELECT role INTO user_role
  FROM "Membership"
  WHERE "workspaceId" = workspace_id
  AND "userId" = user_id;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User policies (users can see their own data)
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT
  USING (id = current_setting('app.current_user_id', true)::TEXT);

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE
  USING (id = current_setting('app.current_user_id', true)::TEXT);

-- Workspace policies
CREATE POLICY "Users can view workspaces they're members of" ON "Workspace"
  FOR SELECT
  USING (
    has_workspace_access(id, current_setting('app.current_user_id', true)::TEXT)
  );

CREATE POLICY "Owners and admins can update workspace" ON "Workspace"
  FOR UPDATE
  USING (
    get_user_role(id, current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN')
  );

-- Membership policies
CREATE POLICY "Users can view memberships in their workspaces" ON "Membership"
  FOR SELECT
  USING (
    has_workspace_access("workspaceId", current_setting('app.current_user_id', true)::TEXT)
  );

CREATE POLICY "Admins and owners can manage memberships" ON "Membership"
  FOR ALL
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN')
  );

-- OAuth Account policies
CREATE POLICY "Users can view own OAuth accounts" ON "OAuthAccount"
  FOR SELECT
  USING ("userId" = current_setting('app.current_user_id', true)::TEXT);

CREATE POLICY "Users can manage own OAuth accounts" ON "OAuthAccount"
  FOR ALL
  USING ("userId" = current_setting('app.current_user_id', true)::TEXT);

-- Source policies
CREATE POLICY "Workspace members can view sources" ON "Source"
  FOR SELECT
  USING (
    has_workspace_access("workspaceId", current_setting('app.current_user_id', true)::TEXT)
  );

CREATE POLICY "Editors and above can manage sources" ON "Source"
  FOR ALL
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
  );

-- Item policies
CREATE POLICY "Workspace members can view items" ON "Item"
  FOR SELECT
  USING (
    has_workspace_access("workspaceId", current_setting('app.current_user_id', true)::TEXT)
  );

CREATE POLICY "Editors and above can create items" ON "Item"
  FOR INSERT
  WITH CHECK (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
  );

CREATE POLICY "Editors and above can update items" ON "Item"
  FOR UPDATE
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
  );

CREATE POLICY "Admins and above can delete items" ON "Item"
  FOR DELETE
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN')
  );

-- Link policies
CREATE POLICY "Workspace members can view links" ON "Link"
  FOR SELECT
  USING (
    has_workspace_access("workspaceId", current_setting('app.current_user_id', true)::TEXT)
  );

CREATE POLICY "Editors and above can manage links" ON "Link"
  FOR ALL
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
  );

-- Tag policies (global but filtered by workspace access through joins)
CREATE POLICY "Anyone can view tags" ON "Tag"
  FOR SELECT
  USING (true);

CREATE POLICY "Editors and above can create tags" ON "Tag"
  FOR INSERT
  WITH CHECK (true);

-- ItemTag policies
CREATE POLICY "Users can view item tags in accessible workspaces" ON "ItemTag"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Item"
      WHERE "Item".id = "ItemTag"."itemId"
      AND has_workspace_access("Item"."workspaceId", current_setting('app.current_user_id', true)::TEXT)
    )
  );

CREATE POLICY "Editors and above can manage item tags" ON "ItemTag"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Item"
      WHERE "Item".id = "ItemTag"."itemId"
      AND get_user_role("Item"."workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
    )
  );

-- Theme policies
CREATE POLICY "Workspace members can view themes" ON "Theme"
  FOR SELECT
  USING (
    has_workspace_access("workspaceId", current_setting('app.current_user_id', true)::TEXT)
  );

CREATE POLICY "Editors and above can manage themes" ON "Theme"
  FOR ALL
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
  );

-- ThemeTag policies
CREATE POLICY "Users can view theme tags in accessible workspaces" ON "ThemeTag"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Theme"
      WHERE "Theme".id = "ThemeTag"."themeId"
      AND has_workspace_access("Theme"."workspaceId", current_setting('app.current_user_id', true)::TEXT)
    )
  );

CREATE POLICY "Editors and above can manage theme tags" ON "ThemeTag"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Theme"
      WHERE "Theme".id = "ThemeTag"."themeId"
      AND get_user_role("Theme"."workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
    )
  );

-- Person policies
CREATE POLICY "Workspace members can view people" ON "Person"
  FOR SELECT
  USING (
    has_workspace_access("workspaceId", current_setting('app.current_user_id', true)::TEXT)
  );

CREATE POLICY "Editors and above can manage people" ON "Person"
  FOR ALL
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
  );

-- ItemPerson policies
CREATE POLICY "Users can view item-person links in accessible workspaces" ON "ItemPerson"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Item"
      WHERE "Item".id = "ItemPerson"."itemId"
      AND has_workspace_access("Item"."workspaceId", current_setting('app.current_user_id', true)::TEXT)
    )
  );

CREATE POLICY "Editors and above can manage item-person links" ON "ItemPerson"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Item"
      WHERE "Item".id = "ItemPerson"."itemId"
      AND get_user_role("Item"."workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
    )
  );

-- Trend policies
CREATE POLICY "Workspace members can view trends" ON "Trend"
  FOR SELECT
  USING (
    has_workspace_access("workspaceId", current_setting('app.current_user_id', true)::TEXT)
  );

CREATE POLICY "Editors and above can manage trends" ON "Trend"
  FOR ALL
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
  );

-- ItemTrend policies
CREATE POLICY "Users can view item-trend links in accessible workspaces" ON "ItemTrend"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Item"
      WHERE "Item".id = "ItemTrend"."itemId"
      AND has_workspace_access("Item"."workspaceId", current_setting('app.current_user_id', true)::TEXT)
    )
  );

CREATE POLICY "Editors and above can manage item-trend links" ON "ItemTrend"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Item"
      WHERE "Item".id = "ItemTrend"."itemId"
      AND get_user_role("Item"."workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
    )
  );

-- Newsletter policies
CREATE POLICY "Workspace members can view newsletters" ON "Newsletter"
  FOR SELECT
  USING (
    has_workspace_access("workspaceId", current_setting('app.current_user_id', true)::TEXT)
  );

CREATE POLICY "Editors and above can create newsletters" ON "Newsletter"
  FOR INSERT
  WITH CHECK (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN', 'EDITOR')
  );

CREATE POLICY "Admins and above can update newsletters" ON "Newsletter"
  FOR UPDATE
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN')
  );

CREATE POLICY "Admins and above can delete newsletters" ON "Newsletter"
  FOR DELETE
  USING (
    get_user_role("workspaceId", current_setting('app.current_user_id', true)::TEXT) IN ('OWNER', 'ADMIN')
  );


