// 수동 발송: Laika에게 8:31 출근 알림 직접 전송
// run/route.ts의 alreadySentCheckin 체크를 우회해서 바로 INSERT + Slack 발송

const mysql = require('mysql2/promise');
const { WebClient } = require('@slack/web-api');
require('dotenv').config({ path: '.env.local' });

const pool = mysql.createPool({ host: '172.17.3.206', user: 'secom', password: 'secom123', database: 'secom' });
const slack = new WebClient(process.env.SLACK_TOKEN);

async function sendDM(email, message) {
  const result = await slack.users.lookupByEmail({ email });
  const userId = result.user?.id;
  if (!userId) throw new Error(`Slack user not found: ${email}`);
  await slack.chat.postMessage({
    channel: userId,
    text: message,
    blocks: [{ type: 'section', text: { type: 'mrkdwn', text: message } }]
  });
  console.log(`  ✅ 발송 완료 -> ${email} (userId: ${userId})`);
}

async function main() {
  // Laika 정보 확인
  const [persons] = await pool.query(
    "SELECT Name, Sabun, Email FROM t_secom_person WHERE Sabun = ?",
    ['KS2602010']
  );
  if (persons.length === 0) { console.error('Laika 정보 없음'); return; }
  const laika = persons[0];
  console.log(`대상: ${laika.Name} | ${laika.Sabun} | ${laika.Email}`);

  // 8:31 WSTime
  const wsTime = '20260429083100';
  const mm = wsTime.substring(4, 6);
  const dd = wsTime.substring(6, 8);
  const hh = wsTime.substring(8, 10);
  const min = wsTime.substring(10, 12);
  const timeDisplay = `${mm}-${dd} ${hh}:${min}`;

  const message = `✅ *출근 확인 완료*\n안녕하세요! 오늘 출근 기록이 정상적으로 등록되었어요.\n• *출근 시간:* ${timeDisplay}\n오늘도 즐거운 하루 되세요! 🥕`;

  console.log('\n발송할 메시지:');
  console.log(message);
  console.log('\n발송 중...');

  try {
    await sendDM(laika.Email, message);

    // trigger_log에 기록 (수동 발송이지만 이력 남김)
    await pool.query(
      "INSERT INTO t_secom_trigger_log (trigger_id, trigger_name, sabun, name, email, notify_type, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [4, 'attendance_smart_alert', laika.Sabun, laika.Name, laika.Email, 'checkin', 'success', '[manual] 08:31 timing miss recovery']
    );
    console.log('  📝 trigger_log 기록 완료');
  } catch (e) {
    console.error('  ❌ 발송 실패:', e.message);
  }

  await pool.end();
}

main().catch(console.error);
