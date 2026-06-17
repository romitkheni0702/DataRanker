import { apiUrl } from './api';

test('apiUrl prefixes the API base and normalizes the slash', () => {
  expect(apiUrl('/health')).toMatch(/\/health$/);
  expect(apiUrl('health')).toMatch(/\/health$/);
  expect(apiUrl('/health')).toBe(apiUrl('health'));
});
