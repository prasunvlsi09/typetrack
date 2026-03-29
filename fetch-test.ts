import fetch from 'node-fetch';

async function testFetch() {
  try {
    console.log('Testing fetch to local API...');
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testFetch();
