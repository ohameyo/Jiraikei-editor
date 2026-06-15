import { ToneRendererSelector } from './ToneRendererSelector.js';
import { WebGLToneRenderer } from './WebGLToneRenderer.js';
import {
  isForcedWebGLToneFailure,
  isWebGLToneRequested,
} from './toneFeatureSwitch.js';
import { createToneRenderRequest } from './toneRequest.js';

export function createToneRuntime({
  cpuRender,
  enabled = false,
  canvasFactory,
  forceFailure = false,
}) {
  const selector = new ToneRendererSelector({
    enabled,
    cpuRender,
    gpuRenderer: new WebGLToneRenderer({ canvasFactory, forceFailure }),
  });

  return Object.freeze({
    render(input) {
      return selector.render(createToneRenderRequest(input));
    },
    getDiagnostics() {
      return selector.getDiagnostics();
    },
    dispose() {
      selector.dispose();
    },
  });
}

export {
  isForcedWebGLToneFailure,
  isWebGLToneRequested,
};
