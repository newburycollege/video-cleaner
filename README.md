# Newbury Video Cleaner

A local Windows/Electron utility that remuxes MP4/MOV files with FFmpeg using stream copy. It does not re-encode video or audio. The original is never changed.

## Requirements
- Windows 10/11, 64-bit
- Node.js LTS (20 or 22 recommended) from https://nodejs.org/
- Internet access is needed once to install/build dependencies. Processing is local afterwards.

## Run from source
1. Extract this folder.
2. Open the folder in File Explorer.
3. Click the address bar, type `cmd`, press Enter.
4. Run: `npm install`
5. Run: `npm start`

## Build a portable EXE
1. In the same Command Prompt, run: `npm run dist`
2. The portable EXE appears in the `dist` folder.
3. Copy that EXE wherever you want. It includes FFmpeg.

## Use
1. Drop an MP4/MOV into the app, or click the drop area.
2. Optional: click Scan for markers.
3. Click Clean video.
4. A new file is saved beside the source as `name-CLEAN.mp4`.
5. Import the clean copy into Premiere Pro, right-click, and choose Scan for Content Credentials.

## What the FFmpeg operation does
Equivalent command:
`ffmpeg -i input.mp4 -map 0:v? -map 0:a? -map 0:s? -map_metadata -1 -map_chapters -1 -c copy -movflags +faststart output-CLEAN.mp4`

This rebuilds the container and omits standard inherited metadata while copying supported video/audio/subtitle streams. The app also scans source/output bytes for the strings `c2pa` and `jumb`. That scan is a useful presence check, not full C2PA cryptographic validation.

## Limitations
- Some unusual MOV/MP4 structures may not remux cleanly.
- Attached data streams are intentionally not copied.
- The app does not claim that absence of text markers proves absence of every possible provenance system.
- Keep the original and your archival master.
- Use this workflow only where removing an erroneous credential is appropriate; do not use it to misrepresent genuinely AI-generated material.
