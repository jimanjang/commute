async function main() {
  try {
    console.log("Triggering GWS users & emails sync API...");
    const res = await fetch('http://localhost:3005/api/admin/users/sync');
    const json = await res.json();
    console.log("API response:");
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

main();
