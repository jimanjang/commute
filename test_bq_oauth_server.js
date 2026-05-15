const { OAuth2Client } = require('google-auth-library');
const { BigQuery } = require('@google-cloud/bigquery');
const http = require('http');
const url = require('url');

const CLIENT_ID = '32555940559.apps.googleusercontent.com';
const CLIENT_SECRET = 'ZmssLNjJy2998hD4CTg2ejr2';
const REDIRECT_URI = 'http://localhost:8080/oauth2callback';

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = url.parse(req.url, true);

    if (reqUrl.pathname === '/') {
      const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
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
      res.write('<h2>인증 완료! BigQuery 데이터를 조회 중입니다... (잠시만 기다려주세요)</h2>');
      
      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const bq = new BigQuery({ 
          projectId: 'karrotmarket',
          authClient: oauth2Client 
        });

        const query = `
          SELECT ts.date, u.email, ts.sheet_type
          FROM \`karrotmarket.db_karrot_cs_kr.time_sheets\` ts
          JOIN \`karrotmarket.db_karrot_cs_kr.admin_users\` u ON ts.admin_user_id = u.id
          LIMIT 5
        `;

        const [rows] = await bq.query({ query });
        
        res.write('<h3>✅ 성공적으로 데이터를 가져왔습니다! 터미널을 확인해주세요.</h3>');
        res.write('<pre>' + JSON.stringify(rows, null, 2) + '</pre>');
        res.end();
        
        console.log('✅ Query Successful! Found data:');
        console.log(JSON.stringify(rows, null, 2));

      } catch (e) {
        res.write('<h3>❌ 오류 발생</h3><p>' + e.message + '</p>');
        res.end();
        console.error('Query Failed:', e.message);
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
  console.log('✅ 로컬 서버가 시작되었습니다!');
  console.log('👉 아래 링크를 브라우저에서 클릭(또는 복사/붙여넣기) 해주세요.');
  console.log('   http://localhost:8080/');
  console.log('====================================================');
});
