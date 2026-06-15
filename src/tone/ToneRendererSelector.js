import { getPassthroughEligibility } from './toneRequest.js';

export class ToneRendererSelector {
  constructor({ enabled = false, cpuRender, gpuRenderer }) {
    if (typeof cpuRender !== 'function') {
      throw new TypeError('ToneRendererSelector requires cpuRender');
    }

    this.enabled = Boolean(enabled);
    this.cpuRender = cpuRender;
    this.gpuRenderer = gpuRenderer;
    this.diagnostics = {
      requestedRenderer: this.enabled ? 'gpu' : 'cpu',
      selectedRenderer: 'cpu',
      eligible: false,
      fallbackReason: this.enabled ? null : 'gpu-disabled',
      width: 0,
      height: 0,
      gpuRenderCount: 0,
      cpuFallbackCount: 0,
      lastError: null,
    };
  }

  render(request) {
    const { width, height } = request.size;
    this.diagnostics.requestedRenderer = this.enabled ? 'gpu' : 'cpu';
    this.diagnostics.width = width;
    this.diagnostics.height = height;
    this.diagnostics.lastError = null;

    if (!this.enabled) {
      return this.renderCpu(request, false, 'gpu-disabled');
    }

    const eligibility = getPassthroughEligibility(request.filters);
    this.diagnostics.eligible = eligibility.eligible;
    if (!eligibility.eligible) {
      return this.renderCpu(request, false, eligibility.reason);
    }

    if (!this.gpuRenderer?.isSupported()) {
      return this.renderCpu(request, true, 'webgl2-unavailable');
    }

    try {
      const result = this.gpuRenderer.render(request);
      this.diagnostics.selectedRenderer = 'gpu';
      this.diagnostics.fallbackReason = null;
      this.diagnostics.gpuRenderCount += 1;
      return result;
    } catch (error) {
      this.diagnostics.lastError = error instanceof Error ? error.message : String(error);
      return this.renderCpu(request, true, 'gpu-render-failed');
    }
  }

  renderCpu(request, eligible, reason) {
    this.diagnostics.selectedRenderer = 'cpu';
    this.diagnostics.eligible = eligible;
    this.diagnostics.fallbackReason = reason;
    this.diagnostics.cpuFallbackCount += 1;
    return this.cpuRender(request);
  }

  getDiagnostics() {
    return { ...this.diagnostics };
  }

  dispose() {
    this.gpuRenderer?.dispose?.();
  }
}
