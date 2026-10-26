const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

function harness(initial) {
  class Element {
    constructor() { this.listeners = {}; this.children = []; this.dataset = {}; this.attributes = {}; this.hidden = false; this.value = ''; this.classList = { toggle() {} }; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    append(...children) { this.children.push(...children); }
    replaceChildren() { this.children = []; }
    setAttribute(name, value) { this.attributes[name] = value; }
    focus() {}
    querySelector(selector) { return selector === 'p' ? emptyTitle : emptyHint; }
    dispatch(name) { this.listeners[name]({ preventDefault() {} }); }
  }
  const ids = Object.fromEntries(['task-form', 'task-input', 'task-list', 'empty', 'storage-error', 'total-count', 'remaining', 'clear-completed'].map(id => [id, new Element()]));
  const emptyTitle = new Element();
  const emptyHint = new Element();
  const filters = ['all', 'active', 'completed'].map(name => { const el = new Element(); el.dataset.filter = name; return el; });
  let data = initial || null;
  const localStorage = { getItem: () => data, setItem: (_, value) => { data = value; } };
  const document = { querySelector: selector => ids[selector.slice(1)], querySelectorAll: () => filters, createElement: () => new Element() };
  vm.runInNewContext(readFileSync('app.js', 'utf8'), { document, localStorage, crypto: { randomUUID }, JSON, String });
  return { ids, filters, getStored: () => JSON.parse(data) };
}

test('add, complete, filter, persist, clear and remove tasks', () => {
  const app = harness();
  const { ids, filters } = app;
  ids['task-input'].value = ' Buy milk ';
  ids['task-form'].dispatch('submit');
  assert.equal(ids['task-list'].children[0].children[1].textContent, 'Buy milk');
  assert.equal(ids.remaining.textContent, '1 task remaining');
  const checkbox = ids['task-list'].children[0].children[0];
  checkbox.checked = true;
  checkbox.dispatch('change');
  assert.equal(ids.remaining.textContent, '0 tasks remaining');
  assert.equal(app.getStored()[0].completed, true);
  filters[1].dispatch('click');
  assert.equal(ids['task-list'].children.length, 0);
  filters[2].dispatch('click');
  assert.equal(ids['task-list'].children.length, 1);
  const restored = harness(JSON.stringify(app.getStored()));
  assert.equal(restored.ids['task-list'].children.length, 1);
  restored.ids['clear-completed'].dispatch('click');
  assert.equal(restored.ids['task-list'].children.length, 0);
  ids['task-input'].value = 'Another task';
  ids['task-form'].dispatch('submit');
  ids['task-list'].children[1].children[2].dispatch('click');
  assert.equal(ids['task-list'].children.length, 1);
});

test('whitespace-only input is ignored', () => {
  const { ids } = harness();
  ids['task-input'].value = '   ';
  ids['task-form'].dispatch('submit');
  assert.equal(ids['task-list'].children.length, 0);
});
