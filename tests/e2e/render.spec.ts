import { test, expect } from './setup';

test.describe('FlowCanvas rendering', () => {
  test('renders all nodes from diagram JSON', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="flow-canvas"]')).toBeVisible();
  });

  test('renders default node with label and description', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-input"]');
    await expect(node).toBeVisible();
    await expect(node).toContainText('Enter credentials');
    await expect(node).toContainText('User provides email and password.');
  });

  test('renders decision node with icon when icon is set', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-validate"]');
    await expect(node).toBeVisible();
    await expect(node).toContainText('Valid credentials?');
    // icon replaces diamond badge when present
    await expect(node.locator('svg')).toBeVisible();
  });

  test('renders start node with icon when icon is set', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-start"]');
    await expect(node).toBeVisible();
    await expect(node).toContainText('User visits login page');
    // icon replaces indicator dot when present
    await expect(node.locator('svg')).toBeVisible();
  });

  test('renders end node with icon when icon is set', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-end-success"]');
    await expect(node).toBeVisible();
    await expect(node).toContainText('Dashboard');
    // icon replaces indicator dot when present
    await expect(node.locator('svg')).toBeVisible();
  });

  test('renders node sections', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-grant"]');
    await expect(node).toContainText('Session');
    await expect(node).toContainText('JWT token with 24h expiry.');
    await expect(node).toContainText('Redirect');
    await expect(node).toContainText('Send to /dashboard.');
  });

  test('renders edges as SVG paths', async ({ page }) => {
    await page.goto('/');
    const svg = page.locator('[data-testid="edge-layer"]');
    await expect(svg).toBeVisible();
    // 6 edges in sample diagram
    const paths = svg.locator('g[data-testid^="edge-"]');
    await expect(paths).toHaveCount(6);
  });

  test('renders edge labels', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="edge-label-e3"]')).toContainText('Yes');
    await expect(page.locator('[data-testid="edge-label-e4"]')).toContainText('No');
  });

  test('nodes are positioned by auto-layout (not stacked)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(200);
    const startBox = await page.locator('[data-testid="node-start"]').boundingBox();
    const inputBox = await page.locator('[data-testid="node-input"]').boundingBox();
    expect(startBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    expect(startBox!.y).toBeLessThan(inputBox!.y);
  });

  test('decision node branches create horizontal spread', async ({ page }) => {
    await page.goto('/');
    // Wait for fitView to settle
    await page.waitForTimeout(200);
    const grantBox = await page.locator('[data-testid="node-grant"]').boundingBox();
    const denyBox = await page.locator('[data-testid="node-deny"]').boundingBox();
    expect(grantBox).not.toBeNull();
    expect(denyBox).not.toBeNull();
    // Grant node is taller due to sections, so top-left y values differ more
    expect(Math.abs(grantBox!.y - denyBox!.y)).toBeLessThan(100);
    expect(Math.abs(grantBox!.x - denyBox!.x)).toBeGreaterThan(50);
  });

  test('full diagram renders with all node types, edges, and labels', async ({ page }) => {
    await page.goto('/');

    // All 8 nodes visible (7 original + 1 auth-group)
    const nodes = page.locator('[data-testid^="node-"]');
    await expect(nodes).toHaveCount(8);

    // All 6 edges rendered
    const edges = page.locator('g[data-testid^="edge-"]');
    await expect(edges).toHaveCount(6);

    // Edge labels present
    await expect(page.locator('[data-testid="edge-label-e3"]')).toContainText('Yes');
    await expect(page.locator('[data-testid="edge-label-e4"]')).toContainText('No');

    // Node types rendered correctly — icons are shown when present
    await expect(page.locator('[data-testid="node-start"] svg')).toBeVisible();
    await expect(page.locator('[data-testid="node-validate"] svg')).toBeVisible();
    await expect(page.locator('[data-testid="node-end-success"] svg')).toBeVisible();
    await expect(page.locator('[data-testid="node-end-fail"] svg')).toBeVisible();

    // Sections rendered
    const grantNode = page.locator('[data-testid="node-grant"]');
    await expect(grantNode).toContainText('Session');
    await expect(grantNode).toContainText('Redirect');
  });
});
