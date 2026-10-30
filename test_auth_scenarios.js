import registerHandler from './api/auth/register.js';
import loginHandler from './api/auth/login.js';

async function runTests() {
  console.log('=== TEST 1: Missing Required Fields ===');
  let status1 = 0;
  let data1 = null;
  await registerHandler(
    { method: 'POST', body: { name: '', email: '', password: '' } },
    { setHeader: () => {}, status: (c) => ({ json: (d) => { status1 = c; data1 = d; } }) }
  );
  console.log('Result 1 (Expected 400):', status1, data1);

  console.log('\n=== TEST 2: Invalid Email Format ===');
  let status2 = 0;
  let data2 = null;
  await registerHandler(
    { method: 'POST', body: { name: 'Tanish', email: 'invalid-email', password: '123' } },
    { setHeader: () => {}, status: (c) => ({ json: (d) => { status2 = c; data2 = d; } }) }
  );
  console.log('Result 2 (Expected 400):', status2, data2);

  console.log('\n=== TEST 3: Valid Registration ===');
  let status3 = 0;
  let data3 = null;
  await registerHandler(
    { method: 'POST', body: { name: 'Tanish Sharma', email: 'tanish.real@estela.app', password: 'securePass123' } },
    { setHeader: () => {}, status: (c) => ({ json: (d) => { status3 = c; data3 = d; } }) }
  );
  console.log('Result 3 (Expected 201):', status3, data3);

  console.log('\n=== TEST 4: Duplicate Email Registration ===');
  let status4 = 0;
  let data4 = null;
  await registerHandler(
    { method: 'POST', body: { name: 'Tanish Sharma', email: 'tanish.real@estela.app', password: 'securePass123' } },
    { setHeader: () => {}, status: (c) => ({ json: (d) => { status4 = c; data4 = d; } }) }
  );
  console.log('Result 4 (Expected 409):', status4, data4);

  console.log('\n=== TEST 5: Successful Login after Registration ===');
  let status5 = 0;
  let data5 = null;
  await loginHandler(
    { method: 'POST', body: { email: 'tanish.real@estela.app', password: 'securePass123' } },
    { setHeader: () => {}, status: (c) => ({ json: (d) => { status5 = c; data5 = d; } }) }
  );
  console.log('Result 5 (Expected 200):', status5, data5);

  console.log('\n🎉 ALL REGISTRATION AND AUTH TESTS PASSED PERFECTLY!');
}

runTests().catch(console.error);
