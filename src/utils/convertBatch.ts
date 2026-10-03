import convertWebPToPNG from './convertWebpToPNG.ts';

export interface ConvertedImage { id: string; blob: Blob; name: string }

export function pngName(name: string): string {
  const safe = name.replace(/[\\/]/g, '_');
  return /\.webp$/i.test(safe) ? safe.replace(/\.webp$/i, '.png') : `${safe}.png`;
}

export function appendUniqueImages(previous: ConvertedImage[], added: ConvertedImage[]): ConvertedImage[] {
  const used = new Set(previous.map((image) => image.name));
  return [...previous, ...added.map((image) => {
    const base = image.name.replace(/\.png$/i, '');
    let name = image.name;
    let number = 2;
    while (used.has(name)) name = `${base} (${number++}).png`;
    used.add(name);
    return { ...image, name };
  })];
}

export async function convertBatch(files: File[], convert = convertWebPToPNG) {
  const valid = files.filter((file) => file.type === 'image/webp');
  const results = await Promise.allSettled(valid.map(async (file) => ({
    id: crypto.randomUUID(), blob: await convert(file), name: pngName(file.name),
  })));
  return {
    images: results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []),
    rejected: files.length - valid.length,
    failed: results.filter((result) => result.status === 'rejected').length,
  };
}
