use wasm_bindgen::prelude::*;

// ---------------------------------------------------------------------------
// Bayer 8×8 matrix — same values as ditherPatterns.js
// ---------------------------------------------------------------------------
const BAYER: [u8; 64] = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

/// Returns true if pixel (x, y) is "on" for the given threshold level (0-63).
/// Matches isDitherOn() in ditherPatterns.js, including the dither offset shift.
#[inline]
fn is_dither_on(x: i32, y: i32, threshold: u8, offset_x: i32, offset_y: i32) -> bool {
    let px = ((x + offset_x).rem_euclid(8)) as usize;
    let py = ((y + offset_y).rem_euclid(8)) as usize;
    BAYER[py * 8 + px] < threshold + 1
}

/// Source-over alpha compositing of a single RGBA color onto an existing pixel.
/// Modifies `dst` (4-byte slice starting at the pixel's offset) in place.
#[inline]
fn composite_over(dst: &mut [u8], sr: u8, sg: u8, sb: u8, sa: u8) {
    if sa == 255 {
        dst[0] = sr;
        dst[1] = sg;
        dst[2] = sb;
        dst[3] = 255;
        return;
    }
    if sa == 0 {
        return;
    }
    let sa_f = sa as f32 / 255.0;
    let da_f = dst[3] as f32 / 255.0;
    let out_a = sa_f + da_f * (1.0 - sa_f);
    if out_a < 1e-6 {
        dst[0] = 0;
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;
        return;
    }
    dst[0] = ((sr as f32 * sa_f + dst[0] as f32 * da_f * (1.0 - sa_f)) / out_a).round() as u8;
    dst[1] = ((sg as f32 * sa_f + dst[1] as f32 * da_f * (1.0 - sa_f)) / out_a).round() as u8;
    dst[2] = ((sb as f32 * sa_f + dst[2] as f32 * da_f * (1.0 - sa_f)) / out_a).round() as u8;
    dst[3] = (out_a * 255.0).round() as u8;
}

// ---------------------------------------------------------------------------
// Phase 1 — Dither stroke rendering
// ---------------------------------------------------------------------------

/// Render a regular dither stroke onto an existing RGBA ImageData buffer.
///
/// `pixels`      — flat RGBA Uint8ClampedArray (canvas_width × canvas_height × 4)
/// `stamp_offsets` — interleaved [dx0, dy0, dx1, dy1, …] relative to the brush centre
/// `points`      — interleaved [cx0, cy0, cx1, cy1, …] brush centre coordinates
/// `threshold`   — Bayer threshold level 0-63 (JS ditherPatterns index)
/// `offset_x/y`  — dither tile phase shift (ditherOffsetX/Y in strokeCtx)
/// `r,g,b,a`     — draw colour
/// `erase`       — if true, set matched pixels to alpha=0 instead of compositing
///
/// Called from actionDitherDraw() JS path; replaces per-pixel fillRect loop.
#[wasm_bindgen]
pub fn render_dither_stroke(
    pixels: &mut [u8],
    canvas_width: u32,
    canvas_height: u32,
    stamp_offsets: &[i32],
    points: &[i32],
    threshold: u8,
    offset_x: i32,
    offset_y: i32,
    r: u8,
    g: u8,
    b: u8,
    a: u8,
    erase: bool,
    two_color_mode: bool,
    sr: u8,
    sg: u8,
    sb: u8,
    sa: u8,
) {
    let w = canvas_width as i32;
    let h = canvas_height as i32;
    let stride = canvas_width as usize * 4;

    let mut i = 0;
    while i + 1 < points.len() {
        let cx = points[i];
        let cy = points[i + 1];
        i += 2;

        let mut j = 0;
        while j + 1 < stamp_offsets.len() {
            let x = cx + stamp_offsets[j];
            let y = cy + stamp_offsets[j + 1];
            j += 2;

            if x < 0 || x >= w || y < 0 || y >= h {
                continue;
            }

            let is_on = is_dither_on(x, y, threshold, offset_x, offset_y);
            let pixel_base = y as usize * stride + x as usize * 4;

            if is_on {
                if erase {
                    pixels[pixel_base + 3] = 0;
                } else {
                    composite_over(&mut pixels[pixel_base..pixel_base + 4], r, g, b, a);
                }
            } else if two_color_mode {
                if erase {
                    pixels[pixel_base + 3] = 0;
                } else {
                    composite_over(&mut pixels[pixel_base..pixel_base + 4], sr, sg, sb, sa);
                }
            }
        }
    }
}

/// Render a build-up dither segment: accumulates density from multiple consecutive
/// actions and writes each pixel exactly once.
///
/// `pixels`          — flat RGBA ImageData buffer (modified in place)
/// `density_map`     — flat i32 array indexed by y*canvas_width+x (replaces JS Map)
///                     Contains prior session density per pixel (read-only here).
/// `delta_actions`   — concatenated delta arrays from all segment actions, separated
///                     by sentinel value 0xFFFF_FFFF (u32::MAX). Each entry is a
///                     packed coord (y << 16 | x) relative to layer origin already
///                     offset to canvas coords.
/// `last_action_idx` — for each unique pixel key, the index of the last action that
///                     touched it (used to look up per-action parameters).
///
/// Because WASM can't hold JS action objects, the caller passes the action
/// parameters as parallel flat arrays (one entry per action in the segment):
/// `action_r/g/b/a`      — draw colours (one per action)
/// `action_sr/sg/sb/sa`  — secondary colours (one per action, used in two-color mode)
/// `action_two_color`    — 1 if two-color mode, 0 otherwise (one per action)
/// `action_buildup_steps` — flat array of step pattern thresholds per action,
///                          with action boundaries given by `action_step_counts`.
/// `action_step_counts`  — number of buildUpSteps entries per action.
/// `action_dither_offset_x/y` — effective dither offsets per action (already adjusted)
/// `erase`               — true = erase mode for the whole segment
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn render_buildup_segment(
    pixels: &mut [u8],
    prior_density_map: &[i32],
    canvas_width: u32,
    canvas_height: u32,
    // Per-action delta coords (packed y<<16|x, already in canvas coords).
    // Actions separated by u32::MAX sentinel.
    delta_with_sentinels: &[u32],
    // Per-action parameters (one entry per action in the segment)
    action_r: &[u8],
    action_g: &[u8],
    action_b: &[u8],
    action_a: &[u8],
    action_sr: &[u8],
    action_sg: &[u8],
    action_sb: &[u8],
    action_sa: &[u8],
    action_two_color: &[u8],
    action_buildup_steps: &[u8],
    action_step_counts: &[u32],
    action_dither_offset_x: &[i32],
    action_dither_offset_y: &[i32],
    erase: bool,
) {
    let w = canvas_width as usize;
    let h = canvas_height as usize;
    let map_size = w * h;

    // Phase 1: build segment_delta (count within this segment) and last_action_idx per pixel.
    // We use flat arrays indexed by y*w+x for O(1) access without JS Map overhead.
    let mut segment_delta = vec![0i32; map_size];
    let mut last_action = vec![u32::MAX; map_size]; // u32::MAX = no action

    let mut action_idx: usize = 0;
    for &packed in delta_with_sentinels.iter() {
        if packed == u32::MAX {
            action_idx += 1;
            continue;
        }
        let x = (packed & 0xffff) as usize;
        let y = ((packed >> 16) & 0xffff) as usize;
        if x >= w || y >= h {
            continue;
        }
        let idx = y * w + x;
        segment_delta[idx] += 1;
        last_action[idx] = action_idx as u32;
    }

    // Phase 2: write each touched pixel once using final density.
    for idx in 0..map_size {
        let seg_count = segment_delta[idx];
        if seg_count == 0 {
            continue;
        }
        let act = last_action[idx] as usize;
        if act >= action_r.len() {
            continue;
        }

        let x = (idx % w) as i32;
        let y = (idx / w) as i32;

        let prior_density = if idx < prior_density_map.len() {
            prior_density_map[idx]
        } else {
            0
        };
        let total_density = prior_density + seg_count;

        // Look up buildUpSteps for this action
        let step_start: usize = action_step_counts[..act].iter().map(|&c| c as usize).sum();
        let step_count = action_step_counts[act] as usize;
        let steps = &action_buildup_steps[step_start..step_start + step_count];
        let step_idx = (total_density as usize - 1).min(steps.len() - 1);
        let threshold = steps[step_idx];

        let off_x = action_dither_offset_x[act];
        let off_y = action_dither_offset_y[act];
        let is_on = is_dither_on(x, y, threshold, off_x, off_y);

        let pixel_base = idx * 4;
        if is_on {
            if erase {
                pixels[pixel_base + 3] = 0;
            } else {
                composite_over(
                    &mut pixels[pixel_base..pixel_base + 4],
                    action_r[act],
                    action_g[act],
                    action_b[act],
                    action_a[act],
                );
            }
        } else if action_two_color[act] != 0 {
            if erase {
                pixels[pixel_base + 3] = 0;
            } else {
                composite_over(
                    &mut pixels[pixel_base..pixel_base + 4],
                    action_sr[act],
                    action_sg[act],
                    action_sb[act],
                    action_sa[act],
                );
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Phase 2 — Flood fill
// ---------------------------------------------------------------------------

/// BFS flood fill on an RGBA ImageData buffer.
/// Matches the scanline algorithm in src/Actions/pointer/fill.js.
/// `pixels`     — flat RGBA Uint8ClampedArray (width × height × 4), modified in place
/// `width/height` — canvas dimensions
/// `start_x/y` — seed coordinate
/// `tr/tg/tb/ta` — target colour (colour to replace)
/// `fr/fg/fb/fa` — fill colour
/// Returns false if start pixel doesn't match target (no-op), true otherwise.
#[wasm_bindgen]
pub fn flood_fill(
    pixels: &mut [u8],
    width: u32,
    height: u32,
    start_x: i32,
    start_y: i32,
    tr: u8,
    tg: u8,
    tb: u8,
    ta: u8,
    fr: u8,
    fg: u8,
    fb: u8,
    fa: u8,
) -> bool {
    let w = width as usize;
    let h = height as usize;
    let stride = w * 4;

    if start_x < 0 || start_y < 0 || start_x as usize >= w || start_y as usize >= h {
        return false;
    }

    let seed_base = start_y as usize * stride + start_x as usize * 4;
    if pixels[seed_base] != tr
        || pixels[seed_base + 1] != tg
        || pixels[seed_base + 2] != tb
        || pixels[seed_base + 3] != ta
    {
        return false;
    }

    // If fill colour equals target colour, nothing to do.
    if tr == fr && tg == fg && tb == fb && ta == fa {
        return false;
    }

    // Scanline BFS — same logic as the JS version.
    let mut stack: Vec<(usize, usize)> = vec![(start_x as usize, start_y as usize)];
    let color_pixel = |pixels: &mut [u8], base: usize| {
        pixels[base] = fr;
        pixels[base + 1] = fg;
        pixels[base + 2] = fb;
        pixels[base + 3] = fa;
    };
    let matches = |pixels: &[u8], base: usize| -> bool {
        pixels[base] == tr
            && pixels[base + 1] == tg
            && pixels[base + 2] == tb
            && pixels[base + 3] == ta
    };

    while let Some((x, mut y)) = stack.pop() {
        let mut base = y * stride + x * 4;
        // Walk up while matching
        while y > 0 && matches(pixels, base - stride) {
            y -= 1;
            base -= stride;
        }
        let mut reach_left = false;
        let mut reach_right = false;
        // Walk down while matching
        while y < h && matches(pixels, base) {
            color_pixel(pixels, base);
            if x > 0 {
                if matches(pixels, base - 4) {
                    if !reach_left {
                        stack.push((x - 1, y));
                        reach_left = true;
                    }
                } else {
                    reach_left = false;
                }
            }
            if x < w - 1 {
                if matches(pixels, base + 4) {
                    if !reach_right {
                        stack.push((x + 1, y));
                        reach_right = true;
                    }
                } else {
                    reach_right = false;
                }
            }
            y += 1;
            base += stride;
        }
    }
    true
}

// ---------------------------------------------------------------------------
// Phase 3 — Color mask (returns packed coords as u32 array)
// ---------------------------------------------------------------------------

/// Scan a canvas ImageData for pixels that exactly match a given RGBA colour.
/// Returns a flat array of packed (y << 16 | x) coordinates — same encoding as
/// maskSet in src/Canvas/masks.js.
#[wasm_bindgen]
pub fn build_color_mask(
    pixels: &[u8],
    width: u32,
    height: u32,
    mr: u8,
    mg: u8,
    mb: u8,
    ma: u8,
) -> Vec<u32> {
    let w = width as usize;
    let h = height as usize;
    let mut out = Vec::new();
    for y in 0..h {
        for x in 0..w {
            let base = (y * w + x) * 4;
            if pixels[base] == mr
                && pixels[base + 1] == mg
                && pixels[base + 2] == mb
                && pixels[base + 3] == ma
            {
                out.push(((y as u32) << 16) | x as u32);
            }
        }
    }
    out
}

// ---------------------------------------------------------------------------
// Phase 3 — Pixel transform operations
// ---------------------------------------------------------------------------

/// Translate pixels with wrapping (matches translateAndWrap in moveHelpers.js).
#[wasm_bindgen]
pub fn translate_and_wrap(pixels: &mut [u8], width: u32, height: u32, dx: i32, dy: i32) {
    let w = width as usize;
    let h = height as usize;
    let len = w * h * 4;
    let src: Vec<u8> = pixels[..len].to_vec();
    // Zero destination
    for p in pixels[..len].iter_mut() {
        *p = 0;
    }
    for y in 0..h {
        for x in 0..w {
            let src_base = (y * w + x) * 4;
            let nx = (x as i32 + dx).rem_euclid(w as i32) as usize;
            let ny = (y as i32 + dy).rem_euclid(h as i32) as usize;
            let dst_base = (ny * w + nx) * 4;
            pixels[dst_base..dst_base + 4].copy_from_slice(&src[src_base..src_base + 4]);
        }
    }
}

/// Translate pixels without wrapping (matches translateWithoutWrap in moveHelpers.js).
#[wasm_bindgen]
pub fn translate_without_wrap(pixels: &mut [u8], width: u32, height: u32, dx: i32, dy: i32) {
    let w = width as usize;
    let h = height as usize;
    let len = w * h * 4;
    let src: Vec<u8> = pixels[..len].to_vec();
    for p in pixels[..len].iter_mut() {
        *p = 0;
    }
    for y in 0..h {
        for x in 0..w {
            let nx = x as i32 + dx;
            let ny = y as i32 + dy;
            if nx >= 0 && nx < w as i32 && ny >= 0 && ny < h as i32 {
                let src_base = (y * w + x) * 4;
                let dst_base = (ny as usize * w + nx as usize) * 4;
                pixels[dst_base..dst_base + 4].copy_from_slice(&src[src_base..src_base + 4]);
            }
        }
    }
}

/// Rotate pixels 90 degrees clockwise or counter-clockwise.
/// `dst` must have the same total byte length as `src` (width×height×4).
/// After a 90-degree rotation, the output dimensions are swapped.
#[wasm_bindgen]
pub fn rotate_90(src: &[u8], dst: &mut [u8], src_width: u32, src_height: u32, clockwise: bool) {
    let sw = src_width as usize;
    let sh = src_height as usize;
    // After rotation: dst_width = sh, dst_height = sw
    let dw = sh;
    for y in 0..sh {
        for x in 0..sw {
            let src_base = (y * sw + x) * 4;
            let (dx, dy) = if clockwise {
                (sh - 1 - y, x)
            } else {
                (y, sw - 1 - x)
            };
            let dst_base = (dy * dw + dx) * 4;
            dst[dst_base..dst_base + 4].copy_from_slice(&src[src_base..src_base + 4]);
        }
    }
}

/// Flip pixels horizontally in place.
#[wasm_bindgen]
pub fn flip_horizontal(pixels: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;
    for y in 0..h {
        let row_start = y * w * 4;
        let row = &mut pixels[row_start..row_start + w * 4];
        for x in 0..w / 2 {
            let a = x * 4;
            let b = (w - 1 - x) * 4;
            row.swap(a, b);
            row.swap(a + 1, b + 1);
            row.swap(a + 2, b + 2);
            row.swap(a + 3, b + 3);
        }
    }
}

/// Flip pixels vertically in place.
#[wasm_bindgen]
pub fn flip_vertical(pixels: &mut [u8], width: u32, height: u32) {
    let w = width as usize;
    let h = height as usize;
    let row_bytes = w * 4;
    for y in 0..h / 2 {
        let top = y * row_bytes;
        let bot = (h - 1 - y) * row_bytes;
        // Can't borrow two slices from pixels at once, so use a temp copy
        let mut tmp = vec![0u8; row_bytes];
        tmp.copy_from_slice(&pixels[top..top + row_bytes]);
        pixels.copy_within(bot..bot + row_bytes, top);
        pixels[bot..bot + row_bytes].copy_from_slice(&tmp);
    }
}
