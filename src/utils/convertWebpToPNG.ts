function convertWebPToPNG(webpBlob: Blob): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject("Could not get canvas 2d context");
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(webpBlob);
  });
}

export default convertWebPToPNG;
