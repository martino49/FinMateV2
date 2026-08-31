#!/usr/bin/env node

/**
 * FinMate Route Test Script
 * Tests all routes for each user role to verify nothing is broken.
 * 
 * Usage: node scripts/test-routes.js
 * Requires: server running on port 3000
 */

const http = require('http');

const BASE = 'http://localhost:3000';

const USERS = {
  superAdmin: { email: 'superadmin@finmate.com', password: 'admin123' },
  admin: { email: 'admin@finmate.com', password: 'admin123' },
  teamLeader: { email: 'teamleader@finmate.com', password: 'admin123' },
  teamMember: { email: 'teammember@finmate.com', password: 'admin123' },
  individualUser: { email: 'user1@finmate.com', password: 'password123' },
};

const ROUTES = {
  public: [
    { method: 'GET', path: '/', expect: 200 },
    { method: 'GET', path: '/health', expect: 200 },
    { method: 'GET', path: '/auth/login', expect: 200 },
    { method: 'GET', path: '/auth/register', expect: 200 },
  ],
  superAdmin: [
    { method: 'GET', path: '/super-admin/dashboard', expect: 200 },
    { method: 'GET', path: '/super-admin/users', expect: 200 },
    { method: 'GET', path: '/super-admin/users/add', expect: 200 },
    { method: 'GET', path: '/super-admin/roles', expect: 200 },
    { method: 'GET', path: '/super-admin/roles/add', expect: 200 },
    { method: 'GET', path: '/super-admin/permissions', expect: 200 },
    { method: 'GET', path: '/super-admin/permissions/add', expect: 200 },
    { method: 'GET', path: '/super-admin/audit-logs', expect: 200 },
    { method: 'GET', path: '/super-admin/notifications', expect: 200 },
    { method: 'GET', path: '/super-admin/system-settings', expect: 200 },
    { method: 'GET', path: '/super-admin/profile', expect: 200 },
  ],
  admin: [
    { method: 'GET', path: '/admin/dashboard', expect: 200 },
    { method: 'GET', path: '/admin/users', expect: 200 },
    { method: 'GET', path: '/admin/users/add', expect: 200 },
    { method: 'GET', path: '/admin/budgets', expect: 200 },
    { method: 'GET', path: '/admin/budgets/create', expect: 200 },
    { method: 'GET', path: '/admin/expenses', expect: 200 },
    { method: 'GET', path: '/admin/expenses/add', expect: 200 },
    { method: 'GET', path: '/admin/teams', expect: 200 },
    { method: 'GET', path: '/admin/reports', expect: 200 },
    { method: 'GET', path: '/admin/notifications', expect: 200 },
    { method: 'GET', path: '/admin/profile', expect: 200 },
  ],
  teamLeader: [
    { method: 'GET', path: '/team-leader/dashboard', expect: 200 },
    { method: 'GET', path: '/team-leader/teams', expect: 200 },
    { method: 'GET', path: '/team-leader/expenses', expect: 200 },
    { method: 'GET', path: '/team-leader/planned-expenses', expect: 200 },
  ],
  teamMember: [
    { method: 'GET', path: '/team-member/dashboard', expect: 200 },
    { method: 'GET', path: '/team-member/expenses', expect: 200 },
  ],
  individualUser: [
    { method: 'GET', path: '/user/dashboard', expect: 200 },
    { method: 'GET', path: '/user/expenses', expect: 200 },
    { method: 'GET', path: '/user/expenses/add', expect: 200 },
    { method: 'GET', path: '/user/budgets', expect: 200 },
    { method: 'GET', path: '/user/budgets/add', expect: 200 },
    { method: 'GET', path: '/user/savings', expect: 200 },
    { method: 'GET', path: '/user/savings/add', expect: 200 },
    { method: 'GET', path: '/user/incomes', expect: 200 },
    { method: 'GET', path: '/user/incomes/add', expect: 200 },
    { method: 'GET', path: '/user/planned-expenses', expect: 200 },
    { method: 'GET', path: '/user/planned-expenses/add', expect: 200 },
    { method: 'GET', path: '/user/upcoming-expenses', expect: 200 },
    { method: 'GET', path: '/user/upcoming-expenses/add', expect: 200 },
    { method: 'GET', path: '/user/notifications', expect: 200 },
    { method: 'GET', path: '/user/settings', expect: 200 },
    { method: 'GET', path: '/user/profile', expect: 200 },
    { method: 'GET', path: '/user/analytics', expect: 200 },
  ],
};

function makeRequest(method, path, cookie) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {},
      timeout: 30000,
    };
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        resolve({ status: res.statusCode, setCookie, data });
      });
    });
    req.on('error', () => resolve({ status: 0, error: 'CONNECTION_FAILED' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'TIMEOUT' }); });
    req.end();
  });
}

async function login(user) {
  const formBody = `email=${encodeURIComponent(user.email)}&password=${encodeURIComponent(user.password)}`;
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(formBody),
        },
        timeout: 30000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const setCookie = res.headers['set-cookie'];
          const cookie = setCookie
            ? setCookie.map((c) => c.split(';')[0]).join('; ')
            : '';
          resolve({ status: res.statusCode, cookie });
        });
      }
    );
    req.on('error', () => resolve({ status: 0, cookie: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, cookie: '' }); });
    req.write(formBody);
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('  FinMate Route Test Script');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;
  const failures = [];

  // Test public routes
  console.log('\n--- Public Routes ---');
  for (const route of ROUTES.public) {
    const res = await makeRequest(route.method, route.path);
    const ok = res.status === route.expect;
    const status = ok ? 'PASS' : 'FAIL';
    const icon = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${icon} ${route.method} ${route.path} → ${res.status} [${status}]`);
    if (ok) passed++; else { failed++; failures.push(`${route.method} ${route.path}: ${res.status}`); }
  }

  // Test authenticated routes for each role
  for (const [role, user] of Object.entries(USERS)) {
    console.log(`\n--- ${role} ---`);
    const loginRes = await login(user);
    if (!loginRes.cookie) {
      console.log(`  \x1b[31m✗ LOGIN FAILED for ${user.email}\x1b[0m`);
      failed++;
      failures.push(`LOGIN ${role}: no cookie`);
      continue;
    }
    console.log(`  \x1b[32m✓ Login OK\x1b[0m`);
    passed++;

    const routes = ROUTES[role] || [];
    for (const route of routes) {
      const res = await makeRequest(route.method, route.path, loginRes.cookie);
      const ok = res.status === route.expect;
      const status = ok ? 'PASS' : 'FAIL';
      const icon = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      console.log(`  ${icon} ${route.method} ${route.path} → ${res.status} [${status}]`);
      if (ok) passed++; else { failed++; failures.push(`${role} ${route.method} ${route.path}: ${res.status}`); }
    }
  }

  // Test auth protection - unauthenticated access to protected routes
  console.log('\n--- Auth Protection (should redirect 302) ---');
  const protectedRoutes = [
    '/super-admin/dashboard',
    '/admin/dashboard',
    '/team-leader/dashboard',
    '/team-member/dashboard',
    '/user/dashboard',
  ];
  for (const path of protectedRoutes) {
    const res = await makeRequest('GET', path);
    const ok = res.status === 302 || res.status === 401 || res.status === 403;
    const icon = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    const status = ok ? 'PASS' : 'FAIL';
    console.log(`  ${icon} GET ${path} → ${res.status} (protected) [${status}]`);
    if (ok) passed++; else { failed++; failures.push(`UNAUTH GET ${path}: ${res.status}`); }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\n  Failures:');
    failures.forEach((f) => console.log(`    - ${f}`));
  }
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
