async function runTrigger(id) {
  try {
    console.log(`Running trigger ID: ${id}...`);
    const res = await fetch('http://localhost:3005/api/admin/bot/triggers/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const json = await res.json();
    console.log(`Trigger ID: ${id} Result:`);
    console.log(JSON.stringify(json, null, 2));
    console.log('-------------------------------------------');
  } catch (err) {
    console.error(`Error running trigger ${id}:`, err);
  }
}

async function main() {
  await runTrigger(7);
  await runTrigger(8);
  await runTrigger(11);
  process.exit();
}

main();
