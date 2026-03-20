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

  test('renders decision node with diamond badge', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-validate"]');
    await expect(node).toBeVisible();
    await expect(node).toContainText('Valid credentials?');
    await expect(node.locator('[data-testid="decision-badge"]')).toBeVisible();
  });

  test('renders start node with green indicator', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-start"]');
    await expect(node).toBeVisible();
    await expect(node).toContainText('User visits login page');
    await expect(node.locator('[data-testid="start-indicator"]')).toBeVisible();
  });

  test('renders end node with red indicator', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-end-success"]');
    await expect(node).toBeVisible();
    await expect(node).toContainText('Dashboard');
    await expect(node.locator('[data-testid="end-indicator"]')).toBeVisible();
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
});
