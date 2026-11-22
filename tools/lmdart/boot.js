const lmdartState = { hydrationClicks: 0, alternate: false };

LMDart.register('hydrate.clicked', context => {
  lmdartState.hydrationClicks += 1;
  const message = LMDart.call('dart.stamp', { value: `hydration click ${lmdartState.hydrationClicks}` });
  LMDart.setText('#hydration-result', `${message}; JavaScript updated this static card.`);
  LMDart.setAttribute('#hydration-card', 'data-state', 'active');
});

LMDart.register('table.selected', context => {
  document.querySelectorAll('#data-table tr[data-selected]').forEach(row => row.removeAttribute('data-selected'));
  document.querySelector(`#data-table tr[data-row="${context.index}"]`)?.setAttribute('data-selected', 'true');
  LMDart.setText('#table-result', `Selected ${context.name}; row ${context.index + 1} from the JSON model.`);
});

LMDart.register('svg.palette', () => {
  lmdartState.alternate = !lmdartState.alternate;
  return lmdartState.alternate ? '#ffcb6b' : '#61d6c5';
});

LMDart.register('canvas.point', context => {
  return Number.isFinite(context.x) && Number.isFinite(context.y) &&
    context.x >= 0 && context.x <= 960 && context.y >= 0 && context.y <= 540;
});

LMDart.register('animation.toggled', context => {
  const button = document.querySelector('#action');
  button.textContent = context.paused ? 'Resume animation' : 'Pause animation';
  button.setAttribute('aria-pressed', String(context.paused));
  LMDart.setText('#status', context.paused ? 'Animation paused by the JavaScript handler.' : 'Animation resumed by the JavaScript handler.');
});

LMDart.register('animation.reset', () => {
  LMDart.setText('#status', 'Animation reset to its initial position and attributes.');
});

LMDart.start();
