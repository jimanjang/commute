const { google } = require('googleapis');
const path = require('path');

async function testSheet() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1EXw7K3hT7by0oVZrl9MOspDsv0-3RmobHUc1kWbh7KY';

    const res = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: true,
      ranges: []
    });
    
    if (res.data.sheets.length > 1) {
      const sheet2 = res.data.sheets[1];
      const gridData2 = sheet2.data[0];
      const rowData2 = gridData2.rowData;
      if (rowData2) {
        const rows2 = rowData2.slice(0, 5).map(row => {
          if (!row.values) return [];
          return row.values.map(cell => cell.formattedValue || '');
        });
        console.log('Sheet 2 data:', JSON.stringify(rows2, null, 2));
      } else {
        console.log('Sheet 2 is empty');
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSheet();
