import { expect, test } from '@playwright/test';

test('failed prediction becomes a targeted lesson, retry, and resolved recommendation', async ({ page, request }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `adaptive-${suffix}@example.test`;
  const password = 'quantum-e2e-123';

  const signup = await request.post('/api/v1/auth/signup', {
    data: { email, password, full_name: 'Adaptive Journey', role: 'student' },
  });
  expect(signup.ok()).toBeTruthy();

  await page.goto('/');
  await page.getByRole('button', { name: /Curious explorer/i }).click();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Continue your journey' }).click();
  await expect(page.getByRole('button', { name: /Adaptive Journey/i })).toBeVisible();

  const token = await page.evaluate(() => localStorage.getItem('ql_jwt_token'));
  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };
  const circuit = {
    schemaVersion: '1.0',
    qubits: 1,
    classicalBits: 1,
    operations: [
      { gate: 'H', targets: [0], step: 0 },
      { gate: 'S', targets: [0], step: 1 },
      { gate: 'H', targets: [0], step: 2 },
    ],
  };

  const failed = await request.post('/api/v1/challenges/born-interference/evaluate', {
    headers,
    data: { circuit, prediction: { '0': 1, '1': 0 } },
  });
  expect(failed.ok()).toBeTruthy();
  expect((await failed.json()).passed).toBe(false);

  await page.goto('/progress');
  await expect(page.getByText('M01 · DETECTED')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rebuild phase and interference' }).first()).toBeVisible();
  await expect(page.getByText(/Predict Phase Interference: score/i)).toBeVisible();
  await page.getByRole('button', { name: 'Open Aria AI tutor' }).click();
  await page.getByLabel('Ask your quantum question').fill('What should I correct in my mental model?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByText(/Personalized from saved evidence \(M01\)/i)).toBeVisible();
  await expect(page.getByText('Deterministic rule checks passed')).toBeVisible();
  await expect(page.getByText(/Evidence used \(1\)/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Relative phase and interference/i })).toBeVisible();
  await page.getByRole('button', { name: 'Close AI tutor' }).click();

  const lesson = await request.post('/api/v1/learn/progress', {
    headers,
    data: {
      module_id: 'm04-superposition-interference',
      lesson_id: 'global-vs-relative-phase',
      content_version: '1.0.0',
      completion_status: 'completed',
    },
  });
  expect(lesson.ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByText('M01 · TARGETED')).toBeVisible();
  await expect(page.getByRole('link', { name: /Start targeted activity/i })).toHaveAttribute('href', '/challenges/born-interference');

  const passed = await request.post('/api/v1/challenges/born-interference/evaluate', {
    headers,
    data: { circuit, prediction: { '0': 0.5, '1': 0.5 } },
  });
  expect(passed.ok()).toBeTruthy();
  expect((await passed.json()).passed).toBe(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Continue to algorithmic interference' }).first()).toBeVisible();

  await page.goto('/labs/studio');
  await page.getByRole('button', { name: 'Compare engines' }).click();
  await expect(page.getByText('Qiskit, PennyLane, and Cirq agree within the configured tolerance.')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('PASS')).toHaveCount(2);
  await page.getByRole('button', { name: 'Run on Qiskit' }).click();
  await expect(page.getByText(/Completed 1024 shots with qiskit-aer/i)).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Circuit name').fill('Adaptive Bell evidence');
  await page.getByRole('button', { name: 'Save circuit' }).click();
  await expect(page.getByText('Circuit saved to your account.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
  const savedCircuits = await request.get('/api/v1/circuits', { headers });
  expect(savedCircuits.ok()).toBeTruthy();
  expect((await savedCircuits.json()).some((item: { title: string }) => item.title === 'Adaptive Bell evidence')).toBe(true);

  await page.getByRole('button', { name: 'Edit code' }).click();
  await page.getByLabel('OpenQASM editor').fill([
    'OPENQASM 3.0;',
    'include "stdgates.inc";',
    'qubit[1] q;',
    'bit[1] c;',
    'h q[0];',
    'c[0] = measure q[0];',
    'x q[0];',
  ].join('\n'));
  await expect(page.getByText(/Valid OpenQASM · 1 qubits · 3 gates/i)).toBeVisible();
  await page.getByRole('button', { name: /Apply to circuit/i }).click();
  await expect(page.getByText(/Pure-state preview stops before measure/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Compare engines' })).toBeDisabled();
  await page.getByRole('button', { name: 'Run on Qiskit' }).click();
  await expect(page.getByText(/Completed 1024 shots with qiskit-aer/i)).toBeVisible({ timeout: 30_000 });
});

test('learner completes a server-graded baseline diagnostic in the UI', async ({ page, request }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `diagnostic-${suffix}@example.test`;
  const password = 'quantum-e2e-123';
  const signup = await request.post('/api/v1/auth/signup', { data: { email, password, full_name: 'Diagnostic Journey', role: 'student' } });
  expect(signup.ok()).toBeTruthy();

  await page.goto('/');
  await page.getByRole('button', { name: /Curious explorer/i }).click();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Continue your journey' }).click();
  await expect(page.getByRole('button', { name: /Diagnostic Journey/i })).toBeVisible();
  await page.goto('/diagnostic?phase=baseline');
  await expect(page.getByRole('heading', { name: 'Map your starting mental models.' })).toBeVisible();

  const firstChoices = [
    'Yes, all branches are read', "Alice's chosen bit", 'Their X-basis statistics', 'Still |+>',
    '|00>', 'A measurement cannot read every branch', 'No, probabilities were equal', 'Classical storage size',
  ];
  for (const choice of firstChoices) await page.getByLabel(choice, { exact: true }).check();
  await page.getByRole('button', { name: /Submit all eight answers/i }).click();
  await expect(page.getByText(/SERVER GRADED/i)).toBeVisible();
  await expect(page.getByText(/2 of 8 concepts verified/i)).toBeVisible();
  await page.getByRole('link', { name: /See evidence and next step/i }).click();
  await expect(page.getByRole('link', { name: /Take post diagnostic/i })).toBeVisible();
});
