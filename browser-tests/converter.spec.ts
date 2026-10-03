import { expect, test, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';

async function setup(page: Page, query = 'vk_platform=desktop_web') {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const externalPosts: string[] = [];
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/umami.js') return route.fulfill({ contentType: 'text/javascript', body: 'window.umami={track(){}};' });
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      if (route.request().method() === 'POST') externalPosts.push(url.origin + url.pathname);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('/?' + query + '#/');
  return { errors, externalPosts };
}
async function webp(page: Page, color: string) {
  return Buffer.from(await page.evaluate((color) => {
    const canvas = document.createElement('canvas'); canvas.width = 40; canvas.height = 30;
    const context = canvas.getContext('2d')!; context.fillStyle = color; context.fillRect(0, 0, 40, 30);
    return canvas.toDataURL('image/webp').split(',')[1];
  }, color), 'base64');
}
async function checkPng(page: Page, bytes: Uint8Array, channel: number) {
  expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const result = await page.evaluate(async (data) => {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)], { type: 'image/png' }));
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext('2d')!; context.drawImage(bitmap, 0, 0);
    const result = { width: bitmap.width, height: bitmap.height, pixel: [...context.getImageData(10, 10, 1, 1).data] };
    bitmap.close(); return result;
  }, [...bytes]);
  expect([result.width, result.height]).toEqual([40, 30]);
  expect(result.pixel[channel]).toBeGreaterThan(240);
}

test('real canvas conversion preserves duplicate filenames and both ZIP images', async ({ page }, info) => {
  const evidence = await setup(page, 'vk_platform=desktop_web&description=mobile_android');
  await page.locator('input[type=file]').setInputFiles([
    { name: 'webp-photo.WEBP', mimeType: 'image/webp', buffer: await webp(page, 'red') },
    { name: 'webp-photo.WEBP', mimeType: 'image/webp', buffer: await webp(page, 'blue') },
  ]);
  await expect(page.getByRole('button', { name: 'Скачать webp-photo.png', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Скачать webp-photo (2).png', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Скачать все', exact: true }).click();
  const download = await downloadPromise; expect(download.suggestedFilename()).toBe('images.zip');
  const file = await download.path(); if (!file) throw Error('Missing local ZIP bytes');
  const zip = await JSZip.loadAsync(await readFile(file));
  expect(Object.keys(zip.files).sort()).toEqual(['webp-photo (2).png', 'webp-photo.png']);
  await checkPng(page, await zip.file('webp-photo.png')!.async('uint8array'), 0);
  await checkPng(page, await zip.file('webp-photo (2).png')!.async('uint8array'), 2);
  await page.screenshot({ path: info.outputPath('converted-images.png'), fullPage: true });
  await page.getByRole('button', { name: 'Удалить webp-photo.png', exact: true }).click();
  await expect(page.getByRole('img', { name: 'webp-photo.png', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Удалить все', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Скачать все', exact: true })).toHaveCount(0);
  expect(evidence.errors).toEqual([]); expect(evidence.externalPosts).toEqual([]);
});

test('a corrupt file does not discard a valid image and retry remains usable after host rejection', async ({ page }) => {
  const evidence = await setup(page, 'vk_platform=desktop_web&vk_mock=init-unavailable');
  const valid = { name: 'good.webp', mimeType: 'image/webp', buffer: await webp(page, 'red') };
  await page.locator('input[type=file]').setInputFiles([valid, { name: 'broken.webp', mimeType: 'image/webp', buffer: Buffer.from('not a webp') }]);
  await expect(page.getByRole('alert')).toContainText('Не удалось прочитать WEBP файлов: 1');
  await expect(page.getByRole('button', { name: 'Скачать good.png', exact: true })).toBeEnabled();
  await page.locator('input[type=file]').setInputFiles(valid);
  await expect(page.getByRole('button', { name: 'Скачать good (2).png', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(evidence.errors).toEqual([]); expect(evidence.externalPosts).toEqual([]);
});

test('mobile host platforms retain the existing product availability message', async ({ page }) => {
  for (const platform of ['mobile_android', 'mobile_iphone', 'mobile_web']) {
    const evidence = await setup(page, 'vk_platform=' + platform);
    await expect(page.getByText('Конвертация файлов в мобильных клиентах будет доступна позднее.')).toBeVisible();
    await expect(page.locator('input[type=file]')).toHaveCount(0);
    expect(evidence.errors).toEqual([]);
  }
});
