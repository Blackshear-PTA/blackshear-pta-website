/**
 * Blackshear PTA - crop geometry gate.
 *
 * The cropper promises that what you see in the frame is what gets published.
 * That promise is entirely this arithmetic, and it is the kind that looks right
 * and is off by a scale factor.
 *
 * Tested as a pure function rather than through the browser deliberately. The
 * DOM version was measurable only while the preview pane happened to be
 * laying out, and produced three rounds of numbers that turned out to be about
 * the pane rather than the code.
 *
 * Run: npm run check:crop
 */
import { baseScale, clampView, centerView, sourceRect } from '../src/lib/crop.ts';

let failures = 0;
const pass = (n) => console.log(`  ok   ${n}`);
const fail = (n, d) => { failures += 1; console.error(`  FAIL ${n}\n       ${d}`); };
const near = (a, b, tol = 0.001) => Math.abs(a - b) < tol;

/** A 3:2 stage, the shape every photo is displayed at. */
const STAGE = { stageW: 600, stageH: 400 };

const SHAPES = [
  ['very wide', 4000, 1000],
  ['very tall', 1000, 4000],
  ['square', 2000, 2000],
  ['already 3:2', 3000, 2000],
  ['smaller than the stage', 300, 200],
  ['one pixel tall', 4000, 1],
];

console.log('the frame is always full (no crop can include empty space):');
for (const [label, imageW, imageH] of SHAPES) {
  let worst = null;
  for (const zoom of [1, 1.5, 2, 3]) {
    // Try to shove the image far outside the frame in every direction.
    for (const [x, y] of [[0, 0], [-99999, -99999], [99999, 99999], [-99999, 99999], [99999, -99999]]) {
      const input = { ...STAGE, imageW, imageH, view: { zoom, x, y } };
      const v = clampView(input);
      const scale = baseScale(input) * zoom;
      const drawnW = imageW * scale;
      const drawnH = imageH * scale;
      const covers =
        v.x <= 0.001 && v.y <= 0.001 &&
        v.x + drawnW >= STAGE.stageW - 0.001 &&
        v.y + drawnH >= STAGE.stageH - 0.001;
      if (!covers) worst = { zoom, x, y, v, drawnW, drawnH };
    }
  }
  if (worst) fail(`${label} (${imageW}x${imageH})`, JSON.stringify(worst));
  else pass(`${label} (${imageW}x${imageH})`);
}

console.log('\nthe source rectangle stays inside the image:');
for (const [label, imageW, imageH] of SHAPES) {
  let bad = null;
  for (const zoom of [1, 1.7, 3]) {
    for (const [x, y] of [[0, 0], [-99999, -99999], [99999, 99999]]) {
      const r = sourceRect({ ...STAGE, imageW, imageH, view: { zoom, x, y } });
      if (r.sx < -0.001 || r.sy < -0.001 ||
          r.sx + r.sw > imageW + 0.001 || r.sy + r.sh > imageH + 0.001) {
        bad = { zoom, x, y, r, imageW, imageH };
      }
    }
  }
  if (bad) fail(`${label} (${imageW}x${imageH})`, JSON.stringify(bad));
  else pass(`${label} (${imageW}x${imageH})`);
}

console.log('\nthe source rectangle always has the stage aspect (3:2):');
for (const [label, imageW, imageH] of SHAPES) {
  const r = sourceRect({ ...STAGE, imageW, imageH, view: centerView({ ...STAGE, imageW, imageH, zoom: 1 }) });
  const aspect = r.sw / r.sh;
  if (near(aspect, 1.5, 0.0001)) pass(`${label} -> ${aspect.toFixed(4)}`);
  else fail(`${label} aspect`, `got ${aspect}, want 1.5`);
}

console.log('\nzoom 1 centered takes the largest possible crop:');
{
  // A 4000x1000 strip: the full height is usable, so the crop is 1000 tall.
  const r = sourceRect({ ...STAGE, imageW: 4000, imageH: 1000, view: centerView({ ...STAGE, imageW: 4000, imageH: 1000, zoom: 1 }) });
  if (near(r.sh, 1000) && near(r.sw, 1500) && near(r.sy, 0) && near(r.sx, 1250)) pass('wide strip uses full height, centered horizontally');
  else fail('wide strip', JSON.stringify(r));

  // A 1000x4000 tower: the full width is usable, so the crop is 1000 wide.
  const t = sourceRect({ ...STAGE, imageW: 1000, imageH: 4000, view: centerView({ ...STAGE, imageW: 1000, imageH: 4000, zoom: 1 }) });
  if (near(t.sw, 1000) && near(t.sh, 666.667, 0.01) && near(t.sx, 0)) pass('tall tower uses full width, centered vertically');
  else fail('tall tower', JSON.stringify(t));

  // An image already 3:2 is used whole.
  const e = sourceRect({ ...STAGE, imageW: 3000, imageH: 2000, view: centerView({ ...STAGE, imageW: 3000, imageH: 2000, zoom: 1 }) });
  if (near(e.sx, 0) && near(e.sy, 0) && near(e.sw, 3000) && near(e.sh, 2000)) pass('3:2 image is used whole, nothing cropped away');
  else fail('3:2 whole', JSON.stringify(e));
}

console.log('\nzooming in takes less of the image, never more:');
{
  const shape = { ...STAGE, imageW: 3000, imageH: 2000 };
  let prev = Infinity;
  for (const zoom of [1, 1.5, 2, 3]) {
    const r = sourceRect({ ...shape, view: centerView({ ...shape, zoom }) });
    const area = r.sw * r.sh;
    if (area > prev) { fail('zoom monotonic', `zoom ${zoom} took MORE of the image`); prev = area; break; }
    prev = area;
  }
  if (prev !== Infinity) pass('area shrinks as zoom increases');
}

console.log('\ndegenerate input does not throw or produce NaN:');
for (const [label, imageW, imageH] of [['zero width', 0, 100], ['zero height', 100, 0], ['both zero', 0, 0]]) {
  try {
    const r = sourceRect({ ...STAGE, imageW, imageH, view: { zoom: 1, x: 0, y: 0 } });
    if (Object.values(r).every((n) => Number.isFinite(n))) pass(`${label} -> finite numbers`);
    else fail(label, JSON.stringify(r));
  } catch (error) { fail(label, `threw: ${error.message}`); }
}

console.log(`\n${failures ? `${failures} failing` : 'all crop geometry checks passed'}.`);
process.exit(failures ? 1 : 0);
