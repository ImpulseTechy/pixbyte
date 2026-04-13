export interface OLEDAnimation {
  id: string;
  name: string;
  category: 'emoji' | 'icons' | 'loaders' | 'indian' | 'festival' | 'text_fx';
  tags: string[];
  supportedSizes: (32 | 48 | 64)[];
  fps: number;
  totalFrames: number;
  byteCount: number;
  frames: { [size: number]: Uint8Array[] };
  drawFrame: (ctx: CanvasRenderingContext2D, frameIndex: number, size: number) => void;
  getArduinoCode: (size: number) => string;
  getMicroPythonCode: (size: number) => string;
}

// Helpers
const getByteCount = (size: number) => (size * size) / 8;

const createBaseAnimation = (
  id: string,
  name: string,
  category: OLEDAnimation['category'],
  tags: string[],
  supportedSizes: (32 | 48 | 64)[],
  fps: number,
  totalFrames: number,
  drawFrame: (ctx: CanvasRenderingContext2D, frameIndex: number, size: number) => void,
  arduinoDrawCalls: string,
  microPythonDrawCalls: string
): OLEDAnimation => {
  const maxBytes = Math.max(...supportedSizes.map(getByteCount));

  return {
    id,
    name,
    category,
    tags,
    supportedSizes,
    fps,
    totalFrames,
    byteCount: maxBytes, 
    frames: {},
    drawFrame,
    getArduinoCode: (size: number) => {
      const delay = Math.round(1000 / fps);
      return `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// 0x1306.dev · animation: ${name} · ${totalFrames} frames · ${delay}ms
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define FRAME_COUNT ${totalFrames}
#define FRAME_DELAY ${delay}

void drawFrame(int frame) {
  display.clearDisplay();

${arduinoDrawCalls}

  display.display();
}

void setup() {
  Wire.begin(21, 22); // SDA=21, SCL=22 for ESP32 DevKit // change to 0x3D if display not found
  display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS);
  display.clearDisplay();
  display.display();
}

void loop() {
  for (int i = 0; i < FRAME_COUNT; i++) {
    drawFrame(i);
    delay(FRAME_DELAY);
  }
}`;
    },
    getMicroPythonCode: (size: number) => {
      const delay = Math.round(1000 / fps);
      return `# 0x1306.dev · animation: ${name} · ${totalFrames} frames · ${delay}ms
import machine
import ssd1306
import time

i2c = machine.I2C(0, scl=machine.Pin(22), sda=machine.Pin(21)) # change to 0x3d if display not found
oled = ssd1306.SSD1306_I2C(128, 64, i2c)

def draw_frame(frame):
    oled.fill(0)
${microPythonDrawCalls}
    oled.show()

while True:
    for i in range(${totalFrames}):
        draw_frame(i)
        time.sleep_ms(${delay})
`;
    }
  };
};

export const animations: OLEDAnimation[] = [
  createBaseAnimation(
    'happy_face',
    'happy_face',
    'emoji',
    ['smile', 'happy', 'blinking'],
    [64],
    10,
    4,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.4;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Mask out center for an outlined face
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Eyes
      const blink = frame === 3;
      const ex = size * 0.15;
      const ey = size * 0.1;
      
      if (!blink) {
        ctx.beginPath(); ctx.arc(cx - ex, cy - ey, size * 0.05, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + ex, cy - ey, size * 0.05, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(cx - ex - 4, cy - ey, 8, 2);
        ctx.fillRect(cx + ex - 4, cy - ey, 8, 2);
      }

      // Smile
      ctx.beginPath();
      ctx.arc(cx, cy + size * 0.05, size * 0.2, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    },
    `  int cx = 64;
  int cy = 32;
  // --- face ---
  display.drawCircle(cx, cy, 25, WHITE);
  
  // --- eyes ---
  if (frame == 3) {
    display.drawFastHLine(cx - 13, cy - 6, 8, WHITE);
    display.drawFastHLine(cx + 5, cy - 6, 8, WHITE);
  } else {
    display.fillCircle(cx - 9, cy - 6, 3, WHITE);
    display.fillCircle(cx + 9, cy - 6, 3, WHITE);
  }

  // --- smile ---
  display.drawCircle(cx, cy + 3, 12, WHITE);
  display.fillRect(cx - 15, cy - 10, 30, 15, BLACK);`,
    `    cx, cy = 64, 32
    # --- face ---
    oled.ellipse(cx, cy, 25, 25, 1)

    # --- eyes ---
    if frame == 3:
        oled.hline(cx - 13, cy - 6, 8, 1)
        oled.hline(cx + 5, cy - 6, 8, 1)
    else:
        oled.fill_rect(cx - 11, cy - 8, 5, 5, 1)
        oled.fill_rect(cx + 7, cy - 8, 5, 5, 1)

    # --- smile ---
    oled.ellipse(cx, cy + 3, 12, 12, 1)
    oled.fill_rect(cx - 15, cy - 10, 30, 15, 0)`
  ),

  createBaseAnimation(
    'sad_face',
    'sad_face',
    'emoji',
    ['sad', 'frown', 'negative'],
    [64],
    5,
    4,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.4;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      const ey = cy - size * 0.1 + (frame % 2 === 0 ? 0 : 1);
      ctx.beginPath(); ctx.arc(cx - size*0.15, ey, size * 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + size*0.15, ey, size * 0.05, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy + size * 0.25, size * 0.15, 1.2 * Math.PI, 1.8 * Math.PI);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    },
    `  int cx = 64;
  int cy = 32;
  // --- face ---
  display.drawCircle(cx, cy, 25, WHITE);

  // --- eyes ---
  int8_t eyeYOffset[] = {0, 1, 0, 1};
  int ey = cy - 6 + eyeYOffset[frame % 4];
  display.fillCircle(cx - 9, ey, 3, WHITE);
  display.fillCircle(cx + 9, ey, 3, WHITE);

  // --- sad mouth ---
  display.drawCircle(cx, cy + 12, 9, WHITE);
  display.fillRect(cx - 15, cy + 12, 30, 15, BLACK);`,
    `    cx, cy = 64, 32
    # --- face ---
    oled.ellipse(cx, cy, 25, 25, 1)
    
    # --- eyes ---
    ey = cy - 6 + (1 if frame % 2 != 0 else 0)
    oled.fill_rect(cx - 11, ey - 2, 5, 5, 1)
    oled.fill_rect(cx + 7, ey - 2, 5, 5, 1)

    # --- sad mouth ---
    oled.ellipse(cx, cy + 12, 9, 9, 1)
    oled.fill_rect(cx - 15, cy + 12, 30, 15, 0)`
  ),

  createBaseAnimation(
    'spinner',
    'spinner',
    'loaders',
    ['loading', 'wait', 'spin'],
    [32, 48],
    15,
    8,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size / 2;
      const baseAng = (frame / 8) * Math.PI * 2;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 0.1;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.35, baseAng, baseAng + Math.PI * 1.5);
      ctx.stroke();
    },
    `  int cx = 64;
  int cy = 32;
  int r = 14;
  float angleOffset = (frame / 8.0) * 2 * PI;
  
  // --- spinner arc ---
  for (float a = 0; a < 1.5 * PI; a += 0.05) {
     float angle = a + angleOffset;
     display.drawPixel(cx + r * cos(angle), cy + r * sin(angle), WHITE);
     display.drawPixel(cx + (r-1) * cos(angle), cy + (r-1) * sin(angle), WHITE);
  }`,
    `    import math
    cx, cy, r = 64, 32, 14
    offset = (frame / 8.0) * 2 * math.pi
    
    # --- spinner arc ---
    a = 0
    while a < 1.5 * math.pi:
        angle = a + offset
        oled.pixel(int(cx + r * math.cos(angle)), int(cy + r * math.sin(angle)), 1)
        oled.pixel(int(cx + (r-1) * math.cos(angle)), int(cy + (r-1) * math.sin(angle)), 1)
        a += 0.05`
  ),

  createBaseAnimation(
    'progress_bar',
    'progress_bar',
    'loaders',
    ['loading', 'bar', 'progress'],
    [64],
    8,
    8,
    (ctx, frame, size) => {
      const w = size * 0.8;
      const h = size * 0.15;
      const x = (size - w) / 2;
      const y = (size - h) / 2;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      const fillProgress = (frame / 7) * (w - 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 2, fillProgress, h - 4);
    },
    `  // --- progress bar ---
  display.drawRect(14, 24, 100, 16, WHITE);
  display.fillRect(16, 26, (frame * 100) / 7 - 4, 12, WHITE);
  
  display.setCursor(54, 45);
  display.print(String((frame * 100) / 7) + "%");`,
    `    # --- progress bar ---
    oled.rect(14, 24, 100, 16, 1)
    oled.fill_rect(16, 26, int((frame * 100) / 7 - 4), 12, 1)
    
    oled.text(str(int((frame * 100) / 7)) + "%", 54, 45, 1)`
  ),

  createBaseAnimation(
    'wifi_connecting',
    'wifi_connecting',
    'icons',
    ['wifi', 'network', 'connect'],
    [32, 48],
    4,
    4,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size * 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 0.08;
      ctx.lineCap = 'round';

      if (frame >= 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      if (frame >= 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.2, 1.25 * Math.PI, 1.75 * Math.PI);
        ctx.stroke();
      }
      if (frame >= 2) {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.4, 1.25 * Math.PI, 1.75 * Math.PI);
        ctx.stroke();
      }
      if (frame >= 3) {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.6, 1.25 * Math.PI, 1.75 * Math.PI);
        ctx.stroke();
      }
    },
    `  int cx = 64;
  int cy = 48;

  // --- wifi dot ---
  display.fillCircle(cx, cy, 3, WHITE);

  // --- wifi arcs ---
  if (frame >= 1) display.drawCircle(cx, cy, 12, WHITE);
  if (frame >= 2) display.drawCircle(cx, cy, 25, WHITE);
  if (frame >= 3) display.drawCircle(cx, cy, 38, WHITE);
  
  // mask out outside bounds to create a 90 deg wedge
  display.fillRect(0, cy + 1, 128, 64, BLACK);
  display.fillRect(0, 0, 24, cy, BLACK);
  display.fillRect(104, 0, 24, cy, BLACK);
  
  // erase specific side clipping
  display.fillTriangle(0, cy, 38, cy, 0, cy-38, BLACK);
  display.fillTriangle(128, cy, 90, cy, 128, cy-38, BLACK);`,
    `    cx, cy = 64, 48
    # --- wifi dot ---
    oled.fill_rect(cx - 2, cy - 2, 5, 5, 1)

    # --- wifi arcs ---
    if frame >= 1: oled.ellipse(cx, cy, 12, 12, 1)
    if frame >= 2: oled.ellipse(cx, cy, 25, 25, 1)
    if frame >= 3: oled.ellipse(cx, cy, 38, 38, 1)

    # mask out outside bounds
    oled.fill_rect(0, cy + 1, 128, 64, 0)
    
    # manual slope masking for wedge
    for i in range(48):
        oled.hline(0, cy - i, 64 - i, 0)
        oled.hline(64 + i, cy - i, 64, 0)`
  ),

  createBaseAnimation(
    'diya_flame',
    'diya_flame',
    'indian',
    ['diya', 'lamp', 'festival'],
    [48, 64],
    12,
    6,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size * 0.6;
      ctx.fillStyle = '#ffffff';

      // Base
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.3, 0, Math.PI);
      ctx.closePath();
      ctx.fill();

      // Flame
      const isFlicker = (frame % 3) === 0;
      const fx = cx + (isFlicker ? (size * 0.02) : 0);
      const fy = cy - size * 0.15 + (isFlicker ? (size * 0.02) : 0);

      ctx.beginPath();
      ctx.moveTo(fx, fy - size * 0.25);
      ctx.quadraticCurveTo(fx + size * 0.1, fy - size * 0.1, fx + size * 0.1, fy);
      ctx.quadraticCurveTo(fx + size * 0.1, fy + size * 0.1, fx, fy + size * 0.1);
      ctx.quadraticCurveTo(fx - size * 0.1, fy + size * 0.1, fx - size * 0.1, fy);
      ctx.quadraticCurveTo(fx - size * 0.1, fy - size * 0.1, fx, fy - size * 0.25);
      ctx.fill();
    },
    `  int cx = 64;
  int cy = 40;
  
  // --- base ---
  display.drawFastHLine(cx - 15, cy + 12, 30, WHITE);
  display.drawFastHLine(cx - 10, cy + 14, 20, WHITE);

  // --- bowl ---
  display.fillRect(cx - 20, cy, 40, 6, WHITE);
  display.fillCircle(cx, cy + 6, 15, WHITE); // wait till mask
  display.fillRect(cx - 20, cy - 15, 40, 15, BLACK); // mask the top half of circle

  // --- wick ---
  display.drawFastVLine(cx, cy - 6, 6, WHITE);

  // --- flame ---
  int8_t flameX[] = { 0,  1, -1,  2, -2,  1};
  int8_t flameY[] = {-8, -9, -7, -8, -9, -7};
  int fx = cx + flameX[frame];
  int fy = cy + flameY[frame];
  
  display.fillCircle(fx, fy - 2, 6, WHITE);
  display.fillTriangle(fx - 6, fy - 2, fx + 6, fy - 2, fx, fy - 14, WHITE);`,
    `    cx, cy = 64, 40
    # --- base ---
    oled.hline(cx - 15, cy + 12, 30, 1)
    oled.hline(cx - 10, cy + 14, 20, 1)

    # --- bowl ---
    oled.fill_rect(cx - 20, cy, 40, 6, 1)
    oled.ellipse(cx, cy + 6, 15, 15, 1, True, 12) # masks bottom half usually

    # --- wick ---
    oled.vline(cx, cy - 6, 6, 1)

    # --- flame ---
    flame_x = [0, 1, -1, 2, -2, 1]
    flame_y = [-8, -9, -7, -8, -9, -7]
    fx = cx + flame_x[frame]
    fy = cy + flame_y[frame]
    
    oled.ellipse(fx, fy - 2, 6, 6, 1, True)
    for i in range(12):
        oled.hline(fx - i//2, fy - 14 + i, i, 1)`
  ),

  createBaseAnimation(
    'cricket_bat',
    'cricket_bat',
    'indian',
    ['cricket', 'sport', 'bat', 'swing'],
    [64],
    12,
    8,
    (ctx, frame, size) => {
      const cx = size * 0.4;
      const cy = size * 0.7;
      ctx.fillStyle = '#ffffff';

      // Ball
      const ballX = cx - (frame * size * 0.08) + size * 0.3;
      const ballY = cy + size * 0.1 - (frame * size * 0.05);
      if (frame > 2) {
        ctx.beginPath();
        ctx.arc(ballX, ballY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(ballX - 6, ballY - 1, 4, 1);
      }

      ctx.save();
      ctx.translate(cx, cy);
      // Swing logic
      const rotation = frame < 4 ? -Math.PI / 4 + (frame * 0.15) : -Math.PI / 4 + (3 * 0.15) - ((frame - 3) * 0.3);
      ctx.rotate(rotation);

      // Handle
      ctx.fillRect(-2, -size * 0.4, 4, size * 0.15);
      // Blade
      ctx.beginPath();
      ctx.moveTo(-4, -size * 0.25);
      ctx.lineTo(4, -size * 0.25);
      ctx.lineTo(5, 0);
      ctx.quadraticCurveTo(0, 5, -5, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    },
    `  int cx = 50;
  int cy = 40;

  // --- ball ---
  int8_t ballX[] = {70, 65, 60, 50, 40, 20, 0, -20};
  int8_t ballY[] = {45, 45, 45, 45, 40, 30, 20, 10};
  if (frame > 2) {
    display.fillCircle(ballX[frame], ballY[frame], 2, WHITE);
    display.drawFastHLine(ballX[frame] - 4, ballY[frame], 4, WHITE);
  }

  // --- bat swing ---
  int8_t hx[] = {cx-15, cx-10, cx-5,  cx,   cx+5, cx+10, cx+5,  cx};
  int8_t hy[] = {cy-20, cy-15, cy-10, cy-5, cy,   cy+5,  cy+15, cy+20};
  int8_t tx[] = {cx-25, cx-10, cx+10, cx+25, cx+30,cx+20, cx+5,  cx-10};
  int8_t ty[] = {cy-40, cy-35, cy-25, cy-15, cy,   cy+15, cy+30, cy+35};
  
  display.drawLine(cx, cy, hx[frame], hy[frame], WHITE); // handle
  for(int offset = -3; offset <= 3; offset++) {
    display.drawLine(hx[frame] + offset, hy[frame], tx[frame] + offset, ty[frame], WHITE);
  }`,
    `    cx, cy = 50, 40

    # --- ball ---
    ball_x = [70, 65, 60, 50, 40, 20, 0, -20]
    ball_y = [45, 45, 45, 45, 40, 30, 20, 10]
    if frame > 2:
        bx = ball_x[frame]
        by = ball_y[frame]
        oled.fill_rect(bx - 2, by - 2, 4, 4, 1)
        oled.hline(bx - 4, by, 4, 1)

    # --- bat swing ---
    hx = [cx-15, cx-10, cx-5,  cx,   cx+5, cx+10, cx+5,  cx]
    hy = [cy-20, cy-15, cy-10, cy-5, cy,   cy+5,  cy+15, cy+20]
    tx = [cx-25, cx-10, cx+10, cx+25, cx+30,cx+20, cx+5,  cx-10]
    ty = [cy-40, cy-35, cy-25, cy-15, cy,   cy+15, cy+30, cy+35]
    
    oled.line(cx, cy, hx[frame], hy[frame], 1)
    for offset in range(-3, 4):
        oled.line(hx[frame] + offset, hy[frame], tx[frame] + offset, ty[frame], 1)`
  ),

  createBaseAnimation(
    'chai_cup',
    'chai_cup',
    'indian',
    ['tea', 'drink', 'cup'],
    [48],
    8,
    4,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size * 0.6;
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 1;

      // Cup 
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.2, 0, Math.PI);
      ctx.lineTo(cx - size * 0.2, cy - size * 0.2);
      ctx.lineTo(cx + size * 0.2, cy - size * 0.2);
      ctx.closePath();
      ctx.stroke();

      // Handle
      ctx.beginPath();
      ctx.arc(cx + size * 0.2, cy - size * 0.1, size * 0.08, -Math.PI/2, Math.PI/2);
      ctx.stroke();

      // Steam
      const sy = cy - size * 0.25;
      for (let i = -1; i <= 1; i++) {
        const offset = (frame + i + 4) % 4;
        ctx.beginPath();
        ctx.moveTo(cx + i * size * 0.08, sy - offset * size * 0.05);
        ctx.quadraticCurveTo(
          cx + i * size * 0.08 + (offset % 2 === 0 ? 3 : -3), sy - offset * size * 0.05 - 3,
          cx + i * size * 0.08, sy - offset * size * 0.05 - 6
        );
        ctx.stroke();
      }
    },
    `  int cx = 64;
  int cy = 40;

  // --- cup ---
  display.drawFastHLine(cx - 10, cy, 20, WHITE);
  display.drawFastVLine(cx - 10, cy - 10, 10, WHITE);
  display.drawFastVLine(cx + 10, cy - 10, 10, WHITE);
  
  // --- handle ---
  display.drawCircle(cx + 10, cy - 6, 4, WHITE);
  display.fillRect(cx - 10, cy - 10, 21, 11, BLACK); // mask internal handle loop

  // --- steam ---
  int sy = cy - 16;
  for(int i = -1; i <= 1; i++) {
     int offset = (frame + i + 4) % 4;
     int sx = cx + (i * 6);
     int sym = sy - (offset * 3);
     display.drawLine(sx, sym, sx + ((offset%2==0) ? 2 : -2), sym - 3, WHITE);
     display.drawLine(sx + ((offset%2==0) ? 2 : -2), sym - 3, sx, sym - 6, WHITE);
  }`,
    `    cx, cy = 64, 40
    # --- cup ---
    oled.hline(cx - 10, cy, 20, 1)
    oled.vline(cx - 10, cy - 10, 10, 1)
    oled.vline(cx + 10, cy - 10, 10, 1)
    
    # --- handle ---
    oled.ellipse(cx + 10, cy - 6, 4, 4, 1)
    oled.fill_rect(cx - 10, cy - 10, 21, 11, 0)

    # --- steam ---
    sy = cy - 16
    for i in [-1, 0, 1]:
        offset = (frame + i + 4) % 4
        sx = cx + (i * 6)
        sym = sy - (offset * 3)
        oled.line(sx, sym, sx + (2 if offset%2==0 else -2), sym - 3, 1)
        oled.line(sx + (2 if offset%2==0 else -2), sym - 3, sx, sym - 6, 1)`
  ),

  createBaseAnimation(
    'auto_rickshaw',
    'auto_rickshaw',
    'indian',
    ['rickshaw', 'tuk_tuk', 'vehicle'],
    [64],
    10,
    6,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size / 2;
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 1;

      // Chassis
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy + 10);
      ctx.lineTo(cx + 10, cy + 10);
      ctx.lineTo(cx + 15, cy);
      ctx.lineTo(cx + 8, cy - 12);
      ctx.lineTo(cx - 12, cy - 12);
      ctx.closePath();
      ctx.stroke();

      // Window / Roof
      ctx.fillRect(cx - 15, cy - 12, 23, 2);
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 10);
      ctx.lineTo(cx + 5, cy - 10);
      ctx.lineTo(cx + 12, cy);
      ctx.lineTo(cx + 8, cy);
      ctx.lineTo(cx + 2, cy - 8);
      ctx.lineTo(cx - 10, cy - 8);
      ctx.closePath();
      ctx.stroke();

      // Wheels
      const tireAnim = frame % 2 === 0;
      const drive = cx - 10;
      const front = cx + 12;
      ctx.beginPath(); ctx.arc(drive, cy + 10, 4, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(front, cy + 10, 3, 0, Math.PI*2); ctx.stroke();
      if (tireAnim) {
        ctx.fillRect(drive-1, cy+9, 2, 2);
        ctx.fillRect(front-1, cy+9, 2, 2);
      }
    },
    `  int cx = 64;
  int cy = 32;

  // --- chassis ---
  display.drawLine(cx - 15, cy + 10, cx + 10, cy + 10, WHITE);
  display.drawLine(cx + 10, cy + 10, cx + 15, cy, WHITE);
  display.drawLine(cx + 15, cy, cx + 8, cy - 12, WHITE);
  display.drawLine(cx + 8, cy - 12, cx - 12, cy - 12, WHITE);
  display.drawLine(cx - 12, cy - 12, cx - 15, cy + 10, WHITE);

  // --- roof and window ---
  display.fillRect(cx - 15, cy - 12, 23, 2, WHITE);
  display.drawLine(cx - 10, cy - 10, cx + 5, cy - 10, WHITE);
  display.drawLine(cx + 5, cy - 10, cx + 12, cy, WHITE);
  display.drawLine(cx + 12, cy, cx + 8, cy, WHITE);
  display.drawLine(cx + 8, cy, cx + 2, cy - 8, WHITE);
  display.drawLine(cx + 2, cy - 8, cx - 10, cy - 8, WHITE);
  display.drawLine(cx - 10, cy - 8, cx - 10, cy - 10, WHITE);

  // --- wheels ---
  int driveX = cx - 10;
  int frontX = cx + 12;
  int wY = cy + 10;
  display.drawCircle(driveX, wY, 4, WHITE);
  display.drawCircle(frontX, wY, 3, WHITE);

  // --- spokes ---
  int8_t spokeAngles[] = {0, 30, 60, 90, 120, 150};
  float angle = spokeAngles[frame % 6] * (PI / 180.0);
  
  display.drawLine(driveX, wY, driveX + 4 * cos(angle), wY + 4 * sin(angle), WHITE);
  display.drawLine(driveX, wY, driveX - 4 * cos(angle), wY - 4 * sin(angle), WHITE);
  
  display.drawLine(frontX, wY, frontX + 3 * cos(angle), wY + 3 * sin(angle), WHITE);
  display.drawLine(frontX, wY, frontX - 3 * cos(angle), wY - 3 * sin(angle), WHITE);`,
    `    import math
    cx, cy = 64, 32

    # --- chassis ---
    oled.line(cx - 15, cy + 10, cx + 10, cy + 10, 1)
    oled.line(cx + 10, cy + 10, cx + 15, cy, 1)
    oled.line(cx + 15, cy, cx + 8, cy - 12, 1)
    oled.line(cx + 8, cy - 12, cx - 12, cy - 12, 1)
    oled.line(cx - 12, cy - 12, cx - 15, cy + 10, 1)

    # --- roof and window ---
    oled.fill_rect(cx - 15, cy - 12, 23, 2, 1)
    oled.line(cx - 10, cy - 10, cx + 5, cy - 10, 1)
    oled.line(cx + 5, cy - 10, cx + 12, cy, 1)
    oled.line(cx + 12, cy, cx + 8, cy, 1)
    oled.line(cx + 8, cy, cx + 2, cy - 8, 1)
    oled.line(cx + 2, cy - 8, cx - 10, cy - 8, 1)
    oled.line(cx - 10, cy - 8, cx - 10, cy - 10, 1)

    # --- wheels ---
    driveX = cx - 10
    frontX = cx + 12
    wY = cy + 10
    oled.ellipse(driveX, wY, 4, 4, 1)
    oled.ellipse(frontX, wY, 3, 3, 1)

    # --- spokes ---
    spoke_angles = [0, 30, 60, 90, 120, 150]
    angle = spoke_angles[frame % 6] * (math.pi / 180.0)
    
    oled.line(driveX, wY, int(driveX + 4 * math.cos(angle)), int(wY + 4 * math.sin(angle)), 1)
    oled.line(driveX, wY, int(driveX - 4 * math.cos(angle)), int(wY - 4 * math.sin(angle)), 1)
    oled.line(frontX, wY, int(frontX + 3 * math.cos(angle)), int(wY + 3 * math.sin(angle)), 1)
    oled.line(frontX, wY, int(frontX - 3 * math.cos(angle)), int(wY - 3 * math.sin(angle)), 1)`
  ),

  createBaseAnimation(
    'rupee_pulse',
    'rupee_pulse',
    'indian',
    ['money', 'rupee', 'pulse'],
    [48],
    12,
    6,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size / 2;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';

      // ₹ Symbol
      ctx.font = `${size * 0.4}px JetBrains Mono`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₹', cx, cy);

      // Pulse
      const r = (frame / 6) * (size * 0.4);
      ctx.globalAlpha = 1 - (frame / 6);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    `  int cx = 64;
  int cy = 32;

  // --- rupee symbol ---
  display.drawFastHLine(cx - 5, cy - 6, 10, WHITE);
  display.drawFastHLine(cx - 5, cy - 3, 8, WHITE);
  display.drawFastVLine(cx - 3, cy - 6, 6, WHITE);
  
  display.drawPixel(cx + 3, cy - 5, WHITE);
  display.drawPixel(cx + 4, cy - 4, WHITE);
  display.drawLine(cx - 3, cy - 1, cx + 5, cy + 6, WHITE);

  // --- pulse ---
  int r = frame * 4;
  if (r > 1) {
    if (frame % 2 == 0) {
      display.drawCircle(cx, cy, r, WHITE);
    } else {
      for(int i = 0; i < 360; i += 20) {
        display.drawPixel(cx + r * cos(i * PI / 180.0), cy + r * sin(i * PI / 180.0), WHITE);
      }
    }
  }`,
    `    import math
    cx, cy = 64, 32

    # --- rupee symbol ---
    oled.hline(cx - 5, cy - 6, 10, 1)
    oled.hline(cx - 5, cy - 3, 8, 1)
    oled.vline(cx - 3, cy - 6, 6, 1)
    oled.pixel(cx + 3, cy - 5, 1)
    oled.pixel(cx + 4, cy - 4, 1)
    oled.line(cx - 3, cy - 1, cx + 5, cy + 6, 1)

    # --- pulse ---
    r = frame * 4
    if r > 1:
        if frame % 2 == 0:
            oled.ellipse(cx, cy, r, r, 1)
        else:
            for i in range(0, 360, 20):
                oled.pixel(int(cx + r*math.cos(i*math.pi/180)), int(cy + r*math.sin(i*math.pi/180)), 1)`
  ),

  createBaseAnimation(
    'train_moving',
    'train_moving',
    'indian',
    ['train', 'vehicle', 'travel'],
    [64],
    15,
    8,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size / 2 + size * 0.1;
      
      // Motion offset mapping
      const offset = -(frame * size * 0.05) % (size * 0.5);

      ctx.save();
      ctx.translate(offset, 0);

      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 1;

      // Track
      ctx.beginPath();
      ctx.moveTo(0, cy + 6);
      ctx.lineTo(size * 1.5, cy + 6);
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const carX = cx + (i * size * 0.4);
        // Box
        ctx.fillRect(carX, cy - 15, size * 0.35, 18);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(carX + 5, cy - 10, 6, 6);
        ctx.fillRect(carX + 15, cy - 10, 6, 6);
        
        ctx.fillStyle = '#ffffff';
        // Connectors
        if (i < 2) {
          ctx.fillRect(carX + size * 0.35, cy - 2, size * 0.05, 2);
        }

        // Wheels
        ctx.beginPath(); ctx.arc(carX + 5, cy + 3, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(carX + size * 0.35 - 5, cy + 3, 2, 0, Math.PI*2); ctx.fill();
      }

      ctx.restore();
    },
    `  int cx = 64;
  int cy = 38;
  
  // Motion offset mapping
  int offset = -((int)(frame * 3.2)) % 32;

  // --- track ---
  display.drawFastHLine(0, cy + 6, 128, WHITE);

  for (int i = 0; i < 3; i++) {
    int carX = cx + (i * 25) + offset;
    
    // box
    display.fillRect(carX, cy - 15, 22, 18, WHITE);
    display.fillRect(carX + 5, cy - 10, 6, 6, BLACK);
    display.fillRect(carX + 15, cy - 10, 6, 6, BLACK);
    
    // connectors
    if (i < 2) {
      display.fillRect(carX + 22, cy - 2, 3, 2, WHITE);
    }

    // wheels
    display.fillCircle(carX + 5, cy + 3, 2, WHITE);
    display.fillCircle(carX + 17, cy + 3, 2, WHITE);
  }`,
    `    cx, cy = 64, 38
    
    # Motion offset mapping
    offset = -int(frame * 3.2) % 32

    # --- track ---
    oled.hline(0, cy + 6, 128, 1)

    for i in range(3):
        car_x = cx + (i * 25) + offset
        
        # box
        oled.fill_rect(car_x, cy - 15, 22, 18, 1)
        oled.fill_rect(car_x + 5, cy - 10, 6, 6, 0)
        oled.fill_rect(car_x + 15, cy - 10, 6, 6, 0)
        
        # connectors
        if i < 2:
            oled.fill_rect(car_x + 22, cy - 2, 3, 2, 1)

        # wheels
        oled.ellipse(car_x + 5, cy + 3, 2, 2, 1, True)
        oled.ellipse(car_x + 17, cy + 3, 2, 2, 1, True)`
  ),

  createBaseAnimation(
    'diwali_burst',
    'diwali_burst',
    'festival',
    ['firework', 'diwali', 'spark'],
    [64],
    12,
    8,
    (ctx, frame, size) => {
      const cx = size / 2;
      const cy = size / 2;

      ctx.strokeStyle = '#ffffff';
      const r = (frame / 8) * (size * 0.4);

      if (frame > 0) {
        ctx.lineWidth = Math.max(1, 3 - (frame * 0.3));
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * (r * 0.5), cy + Math.sin(ang) * (r * 0.5));
          ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
          ctx.stroke();
        }
      }
    },
    `  int cx = 64;
  int cy = 32;

  if (frame > 0) {
    int length = frame * 4 + 4;
    for (int i = 0; i < 12; i++) {
      float ang = (i * 30) * PI / 180.0;
      float x0 = cx + (length * 0.5) * cos(ang);
      float y0 = cy + (length * 0.5) * sin(ang);
      float x1 = cx + length * cos(ang);
      float y1 = cy + length * sin(ang);
      
      display.drawLine(x0, y0, x1, y1, WHITE);
      display.drawPixel(x1 + 2 * cos(ang), y1 + 2 * sin(ang), WHITE); // sparkle
    }
  }`,
    `    import math
    cx, cy = 64, 32

    if frame > 0:
        length = frame * 4 + 4
        for i in range(12):
            ang = (i * 30) * math.pi / 180.0
            x0 = cx + (length * 0.5) * math.cos(ang)
            y0 = cy + (length * 0.5) * math.sin(ang)
            x1 = cx + length * math.cos(ang)
            y1 = cy + length * math.sin(ang)
            
            oled.line(int(x0), int(y0), int(x1), int(y1), 1)
            oled.pixel(int(x1 + 2 * math.cos(ang)), int(y1 + 2 * math.sin(ang)), 1)`
  ),

  createBaseAnimation(
    'flag_wave',
    'flag_wave',
    'festival',
    ['flag', 'india', 'tricolor', 'wave'],
    [64],
    10,
    6,
    (ctx, frame, size) => {
      const cx = size * 0.2;
      const cy = size * 0.2;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;

      // Pole
      ctx.fillRect(cx, cy, 2, size * 0.6);

      // Flag
      for(let r = 0; r < 3; r++) {
         ctx.beginPath();
         for(let x = 0; x <= size * 0.5; x+=2) {
           const yOffset = Math.sin((x * 0.1) + frame) * 3;
           if (x === 0) ctx.moveTo(cx + x + 2, cy + (r * 8) + yOffset);
           else ctx.lineTo(cx + x + 2, cy + (r * 8) + yOffset);
         }
         ctx.stroke();
      }
      
      // Chakra dot
      const yOffset = Math.sin((size * 0.25 * 0.1) + frame) * 3;
      ctx.beginPath();
      ctx.arc(cx + size * 0.25, cy + 8 + yOffset, 2, 0, Math.PI * 2);
      ctx.stroke();
    },
    `  int cx = 30;
  int cy = 20;

  // --- pole ---
  display.fillRect(cx, cy, 2, 38, WHITE);

  // --- flag bands ---
  for (int r = 0; r < 3; r++) {
    for (int x = 0; x <= 32; x += 2) {
      int yOffset = (int)(sin((x * 0.1) + frame) * 3);
      if (r != 1) { // 0=saffron, 2=green (skip 1 for bw visibility)
         display.drawLine(cx + x, cy + (r * 6) + yOffset, cx + x + 2, cy + (r * 6) + (int)(sin(((x+2) * 0.1) + frame) * 3), WHITE);
      }
    }
  }
  
  // --- chakra ---
  int yOffset = (int)(sin((16 * 0.1) + frame) * 3);
  int chakraX = cx + 16;
  int chakraY = cy + 6 + yOffset;
  display.drawCircle(chakraX, chakraY, 2, WHITE);`,
    `    import math
    cx, cy = 30, 20

    # --- pole ---
    oled.fill_rect(cx, cy, 2, 38, 1)

    # --- flag bands ---
    for r in [0, 2]: # skip white middle band
        for x in range(0, 32, 2):
            y_offset = int(math.sin((x * 0.1) + frame) * 3)
            y_next = int(math.sin(((x + 2) * 0.1) + frame) * 3)
            oled.line(cx + x, cy + (r * 6) + y_offset, cx + x + 2, cy + (r * 6) + y_next, 1)

    # --- chakra ---
    y_offset = int(math.sin((16 * 0.1) + frame) * 3)
    oled.ellipse(cx + 16, cy + 6 + y_offset, 2, 2, 1)`
  )
];
