'use strict';

const storageKey = 'daylist.tasks.v1';
const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const list = document.querySelector('#task-list');
const empty = document.querySelector('#empty');
const storageError = document.querySelector('#storage-error');
let filter = 'all';
let tasks = [];

try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(stored)) {
    tasks = stored.filter(task => task && typeof task.id === 'string' && typeof task.text === 'string' && typeof task.completed === 'boolean');
  }
} catch {
  storageError.hidden = false;
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    storageError.hidden = true;
  } catch {
    storageError.hidden = false;
  }
}

function render() {
  list.replaceChildren();
  const visible = tasks.filter(task => filter === 'all' || (filter === 'completed' ? task.completed : !task.completed));
  for (const task of visible) {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' completed' : ''}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark ${task.text} ${task.completed ? 'active' : 'completed'}`);
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      save();
      render();
    });
    const text = document.createElement('span');
    text.className = 'task-label';
    text.textContent = task.text;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'delete-button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${task.text}`);
    remove.addEventListener('click', () => {
      tasks = tasks.filter(entry => entry.id !== task.id);
      save();
      render();
    });
    item.append(checkbox, text, remove);
    list.append(item);
  }
  empty.hidden = visible.length > 0;
  empty.querySelector('p').textContent = filter === 'all' ? 'Nothing here yet.' : `No ${filter} tasks.`;
  empty.querySelector('span:last-child').textContent = filter === 'all' ? 'Add a task above to get started.' : 'Switch filters to see other tasks.';
  document.querySelector('#total-count').textContent = tasks.length;
  const remaining = tasks.filter(task => !task.completed).length;
  document.querySelector('#remaining').textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'} remaining`;
  document.querySelector('#clear-completed').hidden = !tasks.some(task => task.completed);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  tasks.push({ id: crypto.randomUUID(), text, completed: false });
  input.value = '';
  filter = 'all';
  updateFilters();
  save();
  render();
  input.focus();
});

function updateFilters() {
  for (const button of document.querySelectorAll('.filter')) {
    const selected = button.dataset.filter === filter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
}

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  updateFilters();
  render();
}));
document.querySelector('#clear-completed').addEventListener('click', () => {
  tasks = tasks.filter(task => !task.completed);
  save();
  render();
});
render();
