/** 클라이언트에서 이미지를 JPEG data URL로 압축 (DB text 컬럼용) */
export function compressImageFile(
  file: File,
  opts: { maxEdge?: number; quality?: number } = {}
): Promise<string> {
  const maxEdge = opts.maxEdge ?? 1280;
  const quality = opts.quality ?? 0.82;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("load"));
    };
    img.src = objectUrl;
  });
}

export function validateImageFile(file: File): string | null {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    return "jpg, png 파일만 등록할 수 있어요.";
  }
  if (file.size > 10 * 1024 * 1024) {
    return "사진은 10MB 이하로 등록해주세요.";
  }
  return null;
}
