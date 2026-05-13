require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const BASE = 'http://localhost:5000/api';

async function req(method, url, body, token) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

async function login(email, password) {
  const r = await req('POST', '/auth/login', { email, password });
  return r.data.token;
}

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name} ${detail}`);
    failed++;
  }
}

async function run() {
  console.log('\n═══ Этап 5: Тестирование безопасности ═══\n');

  // ── Получаем токены ───────────────────────────────────────────────────────
  console.log('[ Авторизация ]');
  const patientToken = await login('alexey@demo.com', 'demo123');
  check('Пациент alexey вошёл', !!patientToken);

  const doctorToken = await login('doctor@demo.com', 'demo123');
  check('Врач doctor вошёл', !!doctorToken);

  const patient2Token = await login('aigul@demo.com', 'demo123');
  check('Пациент aigul вошёл', !!patient2Token);

  // ── Проверка role в профиле ───────────────────────────────────────────────
  console.log('\n[ Роли пользователей ]');
  const p1 = await req('GET', '/user/me', null, patientToken);
  check('Пациент имеет role=patient', p1.data.role === 'patient');

  const d1 = await req('GET', '/user/me', null, doctorToken);
  check('Врач имеет role=doctor', d1.data.role === 'doctor');

  // ── Пациент не может зайти в роуты врача ──────────────────────────────────
  console.log('\n[ Пациент не может получить роуты врача ]');
  const r1 = await req('GET', '/doctor/patients', null, patientToken);
  check('GET /doctor/patients → 403', r1.status === 403);

  const r2 = await req('GET', '/doctor/patients/1', null, patientToken);
  check('GET /doctor/patients/1 → 403', r2.status === 403);

  const r3 = await req('POST', '/doctor/patients/1/diagnoses', { title: 'Test' }, patientToken);
  check('POST /doctor/patients/1/diagnoses → 403', r3.status === 403);

  // ── Без токена нельзя ─────────────────────────────────────────────────────
  console.log('\n[ Без токена нельзя ]');
  const r4 = await req('GET', '/relatives', null, null);
  check('GET /relatives без токена → 401', r4.status === 401);

  const r5 = await req('GET', '/doctor/patients', null, null);
  check('GET /doctor/patients без токена → 401', r5.status === 401);

  // ── Пациент видит только свои данные ─────────────────────────────────────
  console.log('\n[ Пациент видит только свои данные ]');
  const rel1 = await req('GET', '/relatives', null, patientToken);
  const rel2 = await req('GET', '/relatives', null, patient2Token);

  const ids1 = rel1.data.map(r => r.user_id);
  const ids2 = rel2.data.map(r => r.user_id);

  check('Alexey видит только своих родственников', ids1.every(id => id === p1.data.id));
  check('Aigul видит только своих родственников', ids2.every(id => id !== p1.data.id));
  check('Данные пациентов не пересекаются', !ids1.some(id => ids2.includes(id)));

  // ── Пациент не может удалить чужие данные ────────────────────────────────
  console.log('\n[ Пациент не может трогать чужие данные ]');
  // Получаем id родственника aigul
  const aigulRelId = rel2.data[0]?.id;
  if (aigulRelId) {
    const r6 = await req('DELETE', `/relatives/${aigulRelId}`, null, patientToken);
    check('Alexey не может удалить родственника Aigul → 404', r6.status === 404);
  }

  // ── Врач видит всех пациентов ─────────────────────────────────────────────
  console.log('\n[ Врач видит всех пациентов ]');
  const patients = await req('GET', '/doctor/patients', null, doctorToken);
  check('GET /doctor/patients → 200', patients.status === 200);
  check('Врач видит 3 пациентов', Array.isArray(patients.data) && patients.data.length === 3);
  check('Врач не видит других врачей в списке', patients.data.every(p => p.role !== 'doctor' && !patients.data.find(p2 => p2.email === 'doctor@demo.com')));

  // ── Врач видит данные конкретного пациента ────────────────────────────────
  console.log('\n[ Врач работает с данными пациента ]');
  const patientId = patients.data[0]?.id;
  const patientData = await req('GET', `/doctor/patients/${patientId}`, null, doctorToken);
  check('GET /doctor/patients/:id → 200', patientData.status === 200);
  check('Ответ содержит user, diagnoses, allergies, relatives',
    patientData.data.user && Array.isArray(patientData.data.diagnoses) &&
    Array.isArray(patientData.data.allergies) && Array.isArray(patientData.data.relatives));

  // ── Регистрация нового пользователя всегда patient ───────────────────────
  console.log('\n[ Новый пользователь всегда patient ]');
  const newUser = await req('POST', '/auth/register', {
    email: `test_${Date.now()}@test.com`,
    password: 'test123',
    full_name: 'Тестовый Пользователь',
  });
  check('Регистрация → 201', newUser.status === 201);
  check('Новый пользователь имеет role=patient', newUser.data.user?.role === 'patient');

  // ── Итог ─────────────────────────────────────────────────────────────────
  console.log(`\n═══ Результат: ${passed} пройдено, ${failed} провалено ═══\n`);
  if (failed === 0) console.log('✓ Все проверки пройдены!\n');
  else console.log(`✗ Найдено проблем: ${failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Тест упал:', err.message);
  process.exit(1);
});
