function convertWebPToPNG(webpBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let sourceUrl: string | null = null;
    let settled = false;
    const finish = (blob: Blob | null, error?: unknown) => {
      if (settled) return;
      settled = true;
      img.onload = null;
      img.onerror = null;
      if (sourceUrl !== null) URL.revokeObjectURL(sourceUrl);
      if (blob) resolve(blob);
      else reject(error ?? new Error('Could not encode PNG image'));
    };
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas 2d context');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => finish(blob), 'image/png');
      } catch (error) {
        finish(null, error);
      }
    };
    img.onerror = () => finish(null, new Error('Could not decode WebP image'));
    try {
      sourceUrl = URL.createObjectURL(webpBlob);
      img.src = sourceUrl;
    } catch (error) {
      finish(null, error);
    }
  });
}

export default convertWebPToPNG;
