import { test, expect } from './setup';

test.describe('Canvas interaction', () => {
  test('canvas is pannable by dragging background', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="flow-canvas"]');
    await expect(canvas).toBeVisible();

    const startNode = page.locator('[data-testid="node-start"]');
    const beforeBox = await startNode.boundingBox();

    // Drag the canvas background (not a node)
    await canvas.hover({ position: { x: 10, y: 10 } });
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();

    const afterBox = await startNode.boundingBox();
    expect(afterBox!.x).not.toEqual(beforeBox!.x);
  });

  test('canvas is zoomable with scroll wheel', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="flow-canvas"]');

    const startNode = page.locator('[data-testid="node-start"]');
    const beforeBox = await startNode.boundingBox();

    // Zoom out — Ctrl+wheel (Figma-style: regular scroll pans, Ctrl+scroll zooms)
    await canvas.hover();
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, 300);
    await page.keyboard.up('Control');
    await page.waitForTimeout(100);

    const afterBox = await startNode.boundingBox();
    expect(afterBox!.width).toBeLessThan(beforeBox!.width);
  });

  test('fitView makes all nodes visible on load', async ({ page }) => {
    await page.goto('/');
    for (const id of ['start', 'input', 'validate', 'grant', 'deny', 'end-success', 'end-fail']) {
      const node = page.locator(`[data-testid="node-${id}"]`);
      await expect(node).toBeVisible();
      const box = await node.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-10);
      expect(box!.y).toBeGreaterThanOrEqual(-10);
    }
  });
});
