/** Content rectangle of a video shown with object-fit: contain. No stretching. */
export function containedRect(stageWidth, stageHeight, videoWidth, videoHeight) {
  if (![stageWidth, stageHeight, videoWidth, videoHeight].every(v => Number.isFinite(v) && v > 0)) return null;
  const scale = Math.min(stageWidth / videoWidth, stageHeight / videoHeight);
  const width = videoWidth * scale;
  const height = videoHeight * scale;
  return { left: (stageWidth - width) / 2, top: (stageHeight - height) / 2, width, height };
}

export function pointInVideo(x, y, stageWidth, stageHeight, videoWidth, videoHeight) {
  const rect = containedRect(stageWidth, stageHeight, videoWidth, videoHeight);
  if (!rect) return null;
  const px = (x - rect.left) / rect.width;
  const py = (y - rect.top) / rect.height;
  if (px < 0 || px > 1 || py < 0 || py > 1) return null;
  return { x: px, y: py };
}
