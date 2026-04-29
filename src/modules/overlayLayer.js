function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pxFromNorm(norm, total) {
  return norm * total;
}

function sizePx(layer, bounds) {
  return {
    w: (layer.width ?? 0.2) * bounds.width,
    h: (layer.height ?? 0.2) * bounds.height,
  };
}

function textCss(layer) {
  return {
    color: layer.color ?? '#ffeef5',
    fontSize: `${layer.fontSize ?? 56}px`,
    fontFamily: layer.fontFamily ?? '"Avenir Next", "Segoe UI", sans-serif',
    WebkitTextStroke: `${layer.strokeWidth ?? 4}px ${layer.strokeColor ?? '#2f2532'}`,
    textShadow: `0 0 ${layer.shadowBlur ?? 8}px ${layer.shadowColor ?? '#2f2532'}`,
  };
}

export function createOverlayLayer(overlayEl, store) {
  let drag = null;

  function attachDragHandlers(targetEl, layer, frameRect) {
    targetEl.onpointerdown = (event) => {
      event.preventDefault();
      targetEl.setPointerCapture(event.pointerId);

      const state = store.getState();
      store.selectLayer(layer.id);

      drag = {
        id: layer.id,
        startX: event.clientX,
        startY: event.clientY,
        startLayerX: layer.x,
        startLayerY: layer.y,
        frameRect,
        state,
      };
    };
  }

  function render() {
    const state = store.getState();
    const { layers, selectedLayerId } = state;

    overlayEl.innerHTML = '';
    const frameRect = overlayEl.getBoundingClientRect();

    layers.forEach((layer) => {
      if (!layer.visible) return;
      if (!['sticker', 'text', 'mosaic'].includes(layer.type)) return;

      const item = document.createElement('div');
      item.className = `overlay-item overlay-${layer.type}`;
      if (selectedLayerId === layer.id) item.classList.add('selected');

      const { w, h } = sizePx(layer, frameRect);
      const x = pxFromNorm(layer.x ?? 0.5, frameRect.width);
      const y = pxFromNorm(layer.y ?? 0.5, frameRect.height);

      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      item.style.width = `${w}px`;
      item.style.height = `${h}px`;
      item.style.opacity = `${layer.opacity ?? 1}`;
      item.style.transform = `translate(-50%, -50%) rotate(${layer.rotation ?? 0}deg)`;

      if (layer.type === 'sticker') {
        const img = document.createElement('img');
        img.src = layer.src;
        img.alt = layer.name ?? '贴纸';
        item.appendChild(img);
      }

      if (layer.type === 'text') {
        const textEl = document.createElement('div');
        textEl.className = 'overlay-text';
        textEl.textContent = layer.content ?? '';
        Object.assign(textEl.style, textCss(layer));
        item.appendChild(textEl);
        item.style.width = 'auto';
        item.style.height = 'auto';
        item.style.padding = '8px 12px';
      }

      if (layer.type === 'mosaic') {
        item.style.background = layer.variant === 'frosted' ? 'rgba(239,233,245,0.26)' : 'rgba(26,20,33,0.24)';
        item.style.border = layer.variant === 'frosted' ? '1px dashed rgba(248, 234, 255, 0.9)' : '1px solid rgba(201, 201, 228, 0.8)';
        item.style.borderRadius = `${(layer.feather ?? 0.1) * 40}px`;
      }

      item.onclick = (event) => {
        event.stopPropagation();
        store.selectLayer(layer.id);
      };

      attachDragHandlers(item, layer, frameRect);
      overlayEl.appendChild(item);
    });
  }

  overlayEl.onpointermove = (event) => {
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / drag.frameRect.width;
    const dy = (event.clientY - drag.startY) / drag.frameRect.height;

    store.updateLayer(drag.id, {
      x: clamp(drag.startLayerX + dx, 0, 1),
      y: clamp(drag.startLayerY + dy, 0, 1),
    });
  };

  overlayEl.onpointerup = () => {
    drag = null;
  };

  overlayEl.onclick = () => {
    store.selectLayer(null);
  };

  return { render };
}
