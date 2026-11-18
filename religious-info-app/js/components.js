'use strict';

const COMPONENT_NAMES = ['header', 'sidebar', 'navbar', 'dashboard', 'member-form', 'footer'];
const componentTemplates = new Map();

async function loadComponents() {
  const entries = await Promise.all(COMPONENT_NAMES.map(async (name) => {
    const response = await fetch(`components/${name}.html`);
    if (!response.ok) {
      throw new Error(`Unable to load components/${name}.html (${response.status})`);
    }
    return [name, await response.text()];
  }));
  entries.forEach(([name, template]) => componentTemplates.set(name, template));
  document.querySelector('#header-component').innerHTML = componentTemplates.get('header');
  document.querySelector('#footer-component').innerHTML = componentTemplates.get('footer');
}

function renderComponent(name, values = {}) {
  const template = componentTemplates.get(name);
  if (!template) throw new Error(`Component "${name}" has not been loaded`);
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
  );
}

const componentsReady = loadComponents();
