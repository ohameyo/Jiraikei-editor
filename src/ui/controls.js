export function makeSlider({ label, min, max, step, value, onInput }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-item';

  const title = document.createElement('label');
  title.textContent = `${label}: ${Number(value).toFixed(step < 1 ? 2 : 0)}`;

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);

  input.oninput = () => {
    const numeric = Number(input.value);
    title.textContent = `${label}: ${numeric.toFixed(step < 1 ? 2 : 0)}`;
    onInput(numeric);
  };

  wrapper.append(title, input);
  return wrapper;
}

export function makeColorInput({ label, value, onInput }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-item';

  const title = document.createElement('label');
  title.textContent = label;

  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;

  input.oninput = () => onInput(input.value);
  wrapper.append(title, input);
  return wrapper;
}

export function makeTextInput({ label, value, onInput, multiline = false }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-item';

  const title = document.createElement('label');
  title.textContent = label;

  const input = multiline ? document.createElement('textarea') : document.createElement('input');
  if (!multiline) input.type = 'text';
  input.value = value;

  input.oninput = () => onInput(input.value);
  wrapper.append(title, input);
  return wrapper;
}
