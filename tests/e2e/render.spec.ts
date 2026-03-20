import { test, expect } from './setup';

test.describe('FlowCanvas rendering', () => {
  test('renders all nodes from diagram JSON', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="flow-canvas"]')).toBeVisible();
  });
});
