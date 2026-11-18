'use strict';

function renderDashboardComponent(religions) {
  const cards = religions.map((religion) => `<button class="choice-card" type="button" data-action="religion" data-id="${religion.id}">
    <span class="choice-icon" aria-hidden="true">${religion.icon}</span>
    <h2>${religion.en} – ${religion.am}</h2>
    <p>${religion.id === 'orthodox' ? 'Three organizations – ሶስት ድርጅቶች' : 'Member management – የአባላት አስተዳደር'}</p>
  </button>`).join('');
  return renderComponent('dashboard', { cards });
}
