const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const server = require('./server');

const ready = new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
after(() => server.close());

async function request(path, options) {
  await ready;
  return fetch(`http://127.0.0.1:${server.address().port}${path}`, options);
}

test('serves the app and assets with correct content types', async () => {
  for (const [path, type] of [['/', 'text/html'], ['/style.css', 'text/css'], ['/app.js', 'text/javascript']]) {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), new RegExp(`^${type}`));
    assert.ok((await response.text()).length > 0);
  }
});

test('rejects unknown paths and unsupported methods', async () => {
  assert.equal((await request('/server.js')).status, 404);
  assert.equal((await request('/', { method: 'POST' })).status, 404);
});
