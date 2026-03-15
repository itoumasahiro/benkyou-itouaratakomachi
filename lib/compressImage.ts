const MAX_SIZE = 350 * 1024; // 350KB
const MAX_DIM = 1024;

export async function compressImageTo350KB(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) {
          h = (h * MAX_DIM) / w;
          w = MAX_DIM;
        } else {
          w = (w * MAX_DIM) / h;
          h = MAX_DIM;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      const tryQuality = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression failed"));
              return;
            }
            if (blob.size <= MAX_SIZE || q <= 0.1) {
              resolve(blob);
            } else {
              tryQuality(Math.max(0.1, q - 0.15));
            }
          },
          "image/jpeg",
          q
        );
      };
      tryQuality(0.85);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}
