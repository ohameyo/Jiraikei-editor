(function () {
  const FACE_MESH_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh';
  const SELFIE_SEG_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const exists = Array.from(document.scripts).some((script) => script.src === src);
      if (exists) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`script-load-failed: ${src}`));
      document.head.appendChild(script);
    });
  }

  function toFaceBoxes(landmarksArray, imageWidth, imageHeight) {
    if (!Array.isArray(landmarksArray)) return [];
    return landmarksArray
      .map((landmarks) => {
        if (!Array.isArray(landmarks) || !landmarks.length) return null;
        let minX = 1;
        let minY = 1;
        let maxX = 0;
        let maxY = 0;
        landmarks.forEach((pt) => {
          const x = Number(pt.x);
          const y = Number(pt.y);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        });
        if (maxX <= minX || maxY <= minY) return null;

        const padX = (maxX - minX) * 0.12;
        const padY = (maxY - minY) * 0.16;
        const left = Math.max(0, minX - padX);
        const top = Math.max(0, minY - padY);
        const right = Math.min(1, maxX + padX);
        const bottom = Math.min(1, maxY + padY);

        return {
          x: left * imageWidth,
          y: top * imageHeight,
          width: (right - left) * imageWidth,
          height: (bottom - top) * imageHeight,
        };
      })
      .filter(Boolean);
  }

  function toLandmarks(landmarksArray) {
    if (!Array.isArray(landmarksArray)) return [];
    return landmarksArray
      .map((landmarks) => {
        if (!Array.isArray(landmarks)) return null;
        const pts = landmarks
          .map((pt) => {
            const x = Number(pt.x);
            const y = Number(pt.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
            return { x, y };
          })
          .filter(Boolean);
        return pts.length ? pts : null;
      })
      .filter(Boolean);
  }

  function normalizeMask(segmentationMask, width, height) {
    if (!segmentationMask) return null;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(segmentationMask, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const lum = Math.max(data[i], data[i + 1], data[i + 2]);
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = lum;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  class JiraiVisionSkill {
    constructor() {
      this.faceMesh = null;
      this.selfieSeg = null;
      this.initPromise = null;
      this.queue = Promise.resolve();
      this.available = false;
    }

    async init() {
      if (this.initPromise) return this.initPromise;
      this.initPromise = (async () => {
        await loadScript(`${FACE_MESH_CDN}/face_mesh.js`);
        await loadScript(`${SELFIE_SEG_CDN}/selfie_segmentation.js`);

        if (typeof window.FaceMesh !== 'function' || typeof window.SelfieSegmentation !== 'function') {
          throw new Error('mediapipe-global-missing');
        }

        this.faceMesh = new window.FaceMesh({
          locateFile(file) {
            return `${FACE_MESH_CDN}/${file}`;
          },
        });
        this.faceMesh.setOptions({
          maxNumFaces: 4,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        this.selfieSeg = new window.SelfieSegmentation({
          locateFile(file) {
            return `${SELFIE_SEG_CDN}/${file}`;
          },
        });
        this.selfieSeg.setOptions({
          modelSelection: 1,
        });

        this.available = true;
      })().catch((error) => {
        console.warn('[jiraiVisionSkill] init failed, fallback to native detector:', error);
        this.available = false;
        return null;
      });

      return this.initPromise;
    }

    detectFace(image) {
      return new Promise((resolve) => {
        if (!this.faceMesh) {
          resolve(null);
          return;
        }
        let finished = false;
        this.faceMesh.onResults((results) => {
          if (finished) return;
          finished = true;
          resolve(results || null);
        });
        this.faceMesh.send({ image }).catch(() => resolve(null));
      });
    }

    segmentPerson(image) {
      return new Promise((resolve) => {
        if (!this.selfieSeg) {
          resolve(null);
          return;
        }
        let finished = false;
        this.selfieSeg.onResults((results) => {
          if (finished) return;
          finished = true;
          resolve(results || null);
        });
        this.selfieSeg.send({ image }).catch(() => resolve(null));
      });
    }

    async analyzeImage(image) {
      this.queue = this.queue.then(async () => {
        await this.init();
        if (!this.available) return null;

        const [faceResult, segResult] = await Promise.all([this.detectFace(image), this.segmentPerson(image)]);
        const landmarks = toLandmarks(faceResult?.multiFaceLandmarks || []);
        const faceBoxes = toFaceBoxes(faceResult?.multiFaceLandmarks || [], image.naturalWidth, image.naturalHeight);
        const personMask = normalizeMask(segResult?.segmentationMask || null, image.naturalWidth, image.naturalHeight);

        return {
          faceBoxes,
          faceLandmarks: landmarks,
          personMask,
        };
      });

      try {
        return await this.queue;
      } catch {
        return null;
      }
    }
  }

  window.jiraiVisionSkill = new JiraiVisionSkill();
})();
