import { CSS, LAST_MODIFIED } from './minified';

export const embedStyle = () => {
  if (typeof window === 'undefined') {
    return;
  }
  const exists = document.querySelector(`style.gs-styling[data-modified-at='${LAST_MODIFIED}']`);
  if (exists) {
    return;
  }
  const style = document.createElement('style');
  document.head.appendChild(style);
  style.setAttribute('class', 'gs-styling');
  style.setAttribute('data-modified-at', `${LAST_MODIFIED}`);
  style.innerText = CSS;
};
