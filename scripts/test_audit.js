// Simple test script to POST to /api/prescriptions/audit
const url = 'http://localhost:5000/api/prescriptions/audit';

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'dummydata' }),
    });

    const data = await res.json();
    console.log('STATUS', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Request failed:', err);
    process.exit(1);
  }
})();
