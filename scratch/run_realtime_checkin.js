const main = async () => {
  try {
    console.log("Triggering Realtime Checkin (ID: 7) via Next.js API on port 3005...");
    
    const response = await fetch("http://localhost:3005/api/admin/bot/triggers/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: 7 })
    });
    
    const data = await response.json();
    console.log("\n--- Trigger Execution Response ---");
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error("Error triggering API:", error);
  }
};

main();
