import { test, expect } from './setup';

test.describe('Edit mode', () => {
  test('dragging a node changes its position', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-input"]');
    await expect(node).toBeVisible();

    const beforeBox = await node.boundingBox();

    await node.hover();
    await page.mouse.down();
    await page.mouse.move(beforeBox!.x + 100, beforeBox!.y + 50, { steps: 5 });
    await page.mouse.up();

    const afterBox = await node.boundingBox();
    expect(afterBox!.x).not.toEqual(beforeBox!.x);
  });

  test('onDiagramChange fires after drag', async ({ page }) => {
    await page.goto('/');

    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });

    const node = page.locator('[data-testid="node-input"]');
    const box = await node.boundingBox();

    await node.hover();
    await page.mouse.down();
    await page.mouse.move(box!.x + 80, box!.y + 40, { steps: 5 });
    await page.mouse.up();

    await page.waitForTimeout(200);
    expect(consoleMessages.length).toBeGreaterThan(0);
  });

  test('nodes have data-node-draggable attribute in edit mode', async ({ page }) => {
    await page.goto('/');
    const node = page.locator('[data-testid="node-input"]');
    const wrapper = node.locator('..');
    await expect(wrapper).toHaveAttribute('data-node-draggable', 'true');
  });
});
