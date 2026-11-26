const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function ffmpegPath() {
  if (app.isPackaged) return path.join(process.resourcesPath, 'ffmpeg.exe');
  return require('@ffmpeg-installer/ffmpeg').path;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 820, height: 650, minWidth: 680, minHeight: 560,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('choose-video', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Video files', extensions: ['mp4', 'mov', 'm4v'] }]
  });
  return result.canceled ? null : result.filePaths[0];
});

function cleanOutputPath(input) {
  const p = path.parse(input);
  let candidate = path.join(p.dir, `${p.name}-CLEAN${p.ext}`);
  let n = 2;
  while (fs.existsSync(candidate)) candidate = path.join(p.dir, `${p.name}-CLEAN-${n++}${p.ext}`);
  return candidate;
}

async function containsMarker(file, marker) {
  const needle = Buffer.from(marker, 'ascii');
  const stream = fs.createReadStream(file, { highWaterMark: 1024 * 1024 });
  let tail = Buffer.alloc(0);
  for await (const chunk of stream) {
    const data = Buffer.concat([tail, chunk]);
    if (data.indexOf(needle) !== -1) return true;
    tail = data.subarray(Math.max(0, data.length - needle.length + 1));
  }
  return false;
}

ipcMain.handle('scan-video', async (_event, input) => {
  if (!input || !fs.existsSync(input)) throw new Error('The selected file no longer exists.');
  const markers = ['c2pa', 'jumb', 'C2PA'];
  const hits = [];
  for (const marker of markers) if (await containsMarker(input, marker)) hits.push(marker);
  return { hits: [...new Set(hits.map(x => x.toLowerCase()))] };
});

ipcMain.handle('clean-video', async (event, input) => {
  if (!input || !fs.existsSync(input)) throw new Error('Select a valid MP4 or MOV file first.');
  const output = cleanOutputPath(input);
  const args = [
    '-hide_banner', '-y', '-i', input,
    '-map', '0:v?', '-map', '0:a?', '-map', '0:s?',
    '-map_metadata', '-1', '-map_chapters', '-1',
    '-c', 'copy', '-movflags', '+faststart', output
  ];
  return await new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath(), args, { windowsHide: true });
    let log = '';
    proc.stderr.on('data', data => {
      const text = data.toString(); log += text;
      if (log.length > 200000) log = log.slice(-200000);
      event.sender.send('ffmpeg-log', text);
    });
    proc.on('error', err => reject(new Error(`Could not start FFmpeg: ${err.message}`)));
    proc.on('close', async code => {
      if (code !== 0 || !fs.existsSync(output)) {
        try { if (fs.existsSync(output)) fs.unlinkSync(output); } catch {}
        return reject(new Error(`FFmpeg stopped with code ${code}.\n\n${log.slice(-5000)}`));
      }
      try {
        const scan = await ipcMain.emit;
        const hits = [];
        for (const marker of ['c2pa', 'jumb', 'C2PA']) if (await containsMarker(output, marker)) hits.push(marker.toLowerCase());
        resolve({ output, hits: [...new Set(hits)] });
      } catch (e) { resolve({ output, hits: [], warning: e.message }); }
    });
  });
});

ipcMain.handle('show-file', async (_event, file) => {
  if (file && fs.existsSync(file)) require('electron').shell.showItemInFolder(file);
});
