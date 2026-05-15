const { OAuth2Client } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const CLIENT_ID = '32555940559.apps.googleusercontent.com';
const CLIENT_SECRET = 'ZmssLNjJy2998hD4CTg2ejr2';
const REDIRECT_URI = 'http://localhost:8080/oauth2callback';

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const TOKEN_PATH = path.join(__dirname, 'token.json');

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = url.parse(req.url, true);

    if (reqUrl.pathname === '/') {
      const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // Force to get refresh_token
        scope: ['https://www.googleapis.com/auth/bigquery'],
      });
      res.writeHead(302, { Location: authorizeUrl });
      res.end();
    } else if (reqUrl.pathname === '/oauth2callback') {
      const code = reqUrl.query.code;
      if (!code) {
        res.end('Error: No code found in URL');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.write('<h2>토큰 발급 및 저장 중입니다... (잠시만 기다려주세요)</h2>');
      
      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        
        // Save the token to disk for later cron execution
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log('✅ token.json 저장 완료!');

        // Query the sheet_type mapping
        const bq = new BigQuery({ 
          projectId: 'karrotmarket',
          authClient: oauth2Client 
        });

        const query = `
          SELECT * FROM \`karrotmarket.team_operation.utility_time_sheets_sheet_type\`
        `;

        const [rows] = await bq.query({ query });
        
        res.write('<h3>✅ 성공적으로 영구 토큰(token.json)을 저장했습니다!</h3>');
        res.write('<h4>📌 휴가 타입(sheet_type) 매핑 정보:</h4>');
        res.write('<pre>' + JSON.stringify(rows, null, 2) + '</pre>');
        res.write('<p>이제 창을 닫고 터미널로 돌아가주세요.</p>');
        res.end();
        
        console.log('✅ Sheet Type Mapping Found:');
        console.log(JSON.stringify(rows, null, 2));

      } catch (e) {
        res.write('<h3>❌ 오류 발생</h3><p>' + e.message + '</p>');
        res.end();
        console.error('Query/Token Failed:', e.message);
      }
      
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (err) {
    res.end('Error: ' + err.message);
  }
});

server.listen(8080, () => {
  console.log('====================================================');
  console.log('✅ 로컬 서버가 시작되었습니다! (영구 토큰 발급용)');
  console.log('👉 아래 링크를 클릭해서 한 번 더 로그인해주세요!');
  console.log('   http://localhost:8080/');
  console.log('====================================================');
});
