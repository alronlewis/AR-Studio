# AR Studio — WebAR alternative MVP

This is a browser-based starter builder for image-tracking WebAR. It is a custom MVP, not a complete hosted no-code platform clone.

## Features in this prototype
- Studio UI with project name and asset inputs
- MindAR compiled image-target upload (`.mind`)
- GLB/GLTF model upload
- Object scale, XYZ position and XYZ rotation controls
- Optional target-image preview
- QR code creation from a published URL
- Export a viewer HTML and configuration

## Important limits
- This version exports a self-contained viewer HTML plus a config JSON; it does not yet package a deploy-ready ZIP automatically.
- It requires internet access for A-Frame, MindAR and QRCode.js CDN scripts.
- Camera access requires HTTPS or localhost.
- For target compiling, use the MindAR compiler linked inside the Studio.
- The project is an MVP, not a hosted dashboard, user account system, cloud asset manager, or true visual 3D editor.
- Test on real phones; browser and device AR support varies.

## Use
1. Open `index.html` on a computer with internet.
2. Compile your image target with MindAR and upload the `.mind` file.
3. Upload a `.glb` 3D model.
4. Tune scale/position/rotation.
5. Host the final viewer on an HTTPS static host.
6. Paste the public viewer URL into the QR section and generate/download the QR.

## Hosting Studio
Upload these files to GitHub Pages or another HTTPS static hosting provider. For camera experience, use the exported viewer page on HTTPS.