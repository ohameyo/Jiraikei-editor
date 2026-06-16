function readQuery(locationLike) {
  try {
    return new URLSearchParams(locationLike?.search || '');
  } catch {
    return new URLSearchParams();
  }
}

export function isWebGLToneRequested(
  locationLike = globalThis.location,
  storageLike = globalThis.localStorage,
) {
  const queryValue = readQuery(locationLike).get('v3gpu');
  if (queryValue === '1') return true;
  if (queryValue === '0') return false;

  try {
    const storageValue = storageLike?.getItem('jirai-v3-gpu');
    if (storageValue === '1') return true;
    if (storageValue === '0') return false;
  } catch {
    return true;
  }

  return true;
}

export function isForcedWebGLToneFailure(locationLike = globalThis.location) {
  return readQuery(locationLike).get('v3gpuFail') === '1';
}
