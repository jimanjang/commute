import { BigQuery } from '@google-cloud/bigquery';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

const CLIENT_ID = '32555940559.apps.googleusercontent.com';
const CLIENT_SECRET = 'ZmssLNjJy2998hD4CTg2ejr2';

export async function getBigQueryClient() {
  const tokenPath = path.join(process.cwd(), 'token.json');
  
  if (!fs.existsSync(tokenPath)) {
    throw new Error('token.json not found. Please run the generation script first.');
  }

  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials(tokens);

  // Refresh token automatically if needed
  oauth2Client.on('tokens', (newTokens) => {
    const updatedTokens = { ...tokens, ...newTokens };
    fs.writeFileSync(tokenPath, JSON.stringify(updatedTokens, null, 2));
  });

  return new BigQuery({
    projectId: 'karrotmarket',
    authClient: oauth2Client
  });
}
