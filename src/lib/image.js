const MAX_DIMENSION = 960;
const JPEG_QUALITY = 0.74;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The selected image could not be read.'));
    image.src = src;
  });
}

function fitSize(width, height, maxDimension = MAX_DIMENSION) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function drawAsJpeg(image, maxDimension = MAX_DIMENSION) {
  const { width, height } = fitSize(image.naturalWidth || image.width, image.naturalHeight || image.height, maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Your browser cannot prepare this image.');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export async function optimizeImageFile(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    return drawAsJpeg(image);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function captureVideoFrame(video) {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error('The camera is still starting. Please try again in a moment.');
  }

  const { width, height } = fitSize(video.videoWidth, video.videoHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Your browser cannot capture a camera frame.');
  }

  context.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
