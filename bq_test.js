const { BigQuery } = require('@google-cloud/bigquery');

async function explore() {
  const bigquery = new BigQuery({ keyFilename: 'service-account.json' });

  try {
    const [datasets] = await bigquery.getDatasets();
    console.log("Datasets found:");
    for (const dataset of datasets) {
      console.log(`- ${dataset.id}`);
      const [tables] = await dataset.getTables();
      for (const table of tables) {
        console.log(`  * ${table.id}`);
        
        // if it looks like workhistory, let's get schema
        if (table.id.toLowerCase().includes('work') || table.id.toLowerCase().includes('history')) {
          const [metadata] = await table.getMetadata();
          console.log(`    Schema for ${table.id}:`, metadata.schema.fields.map(f => f.name).join(', '));
        }
      }
    }
  } catch (err) {
    console.error("Error exploring BigQuery:", err);
  }
}

explore();
