/**
 * Crop geometry for the announcement photo editor.
 *
 * Pulled out of the page as a pure function so it can be tested without a
 * browser. The DOM side of the cropper is a few style assignments and is easy
 * to eyeball; this arithmetic is neither, and getting it wrong produces a
 * published photo cropped somewhere other than where the person aiming it was
 * looking.
 *
 * Coordinates: the stage is the visible 3:2 window. `x`/`y` are the offset of
 * the image's top-left corner relative to the stage's, so they are zero or
 * negative once the image covers the stage.
 */

export interface CropView {
  /** 1 = the image exactly covers the stage. Larger crops in further. */
  zoom: number;
  x: number;
  y: number;
}

export interface CropInput {
  stageW: number;
  stageH: number;
  imageW: number;
  imageH: number;
  view: CropView;
}

/** Scale at which the image exactly covers the stage: the zoom-1 baseline. */
export function baseScale(input: Omit<CropInput, 'view'>): number {
  const { stageW, stageH, imageW, imageH } = input;
  if (imageW <= 0 || imageH <= 0) return 1;
  return Math.max(stageW / imageW, stageH / imageH);
}

/**
 * The offset, pulled back inside the range where the image still covers the
 * stage. This is the invariant the whole cropper rests on: there is no
 * position, at any zoom, that lets empty space into the frame.
 */
export function clampView(input: CropInput): CropView {
  const { stageW, stageH, imageW, imageH, view } = input;
  const scale = baseScale(input) * view.zoom;
  const drawnW = imageW * scale;
  const drawnH = imageH * scale;
  return {
    zoom: view.zoom,
    x: Math.min(0, Math.max(stageW - drawnW, view.x)),
    y: Math.min(0, Math.max(stageH - drawnH, view.y)),
  };
}

/** Centers the image in the stage at the current zoom. */
export function centerView(input: Omit<CropInput, 'view'> & { zoom: number }): CropView {
  const scale = baseScale(input) * input.zoom;
  return clampView({
    ...input,
    view: {
      zoom: input.zoom,
      x: (input.stageW - input.imageW * scale) / 2,
      y: (input.stageH - input.imageH * scale) / 2,
    },
  });
}

export interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * The region of the ORIGINAL image currently visible in the stage, in image
 * pixels. This is what gets handed to drawImage, so it is literally what the
 * person sees becoming what gets stored.
 */
export function sourceRect(input: CropInput): SourceRect {
  const view = clampView(input);
  const scale = baseScale(input) * view.zoom;
  return {
    sx: -view.x / scale,
    sy: -view.y / scale,
    sw: input.stageW / scale,
    sh: input.stageH / scale,
  };
}
