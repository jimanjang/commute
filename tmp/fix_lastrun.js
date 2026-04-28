const fs = require('fs');
let content = fs.readFileSync('src/app/admin/notifications/page.tsx', 'utf8');

const oldStr = `format(new Date(trigger.last_run), "yyyy. MM. dd. a hh:mm:ss")`;
const newStr = `new Date(trigger.last_run).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync('src/app/admin/notifications/page.tsx', content, 'utf8');
  console.log('SUCCESS: Replaced last_run format');
} else {
  // Try to find it with different quote styles
  const patterns = [
    `format(new Date(trigger.last_run), "yyyy. MM. dd. a hh:mm:ss")`,
    `format(new Date(trigger.last_run), 'yyyy. MM. dd. a hh:mm:ss')`,
  ];
  let found = false;
  for (const p of patterns) {
    if (content.includes(p)) {
      content = content.replace(p, newStr);
      fs.writeFileSync('src/app/admin/notifications/page.tsx', content, 'utf8');
      console.log('SUCCESS with pattern:', p);
      found = true;
      break;
    }
  }
  if (!found) {
    // Search character by character
    const idx = content.indexOf('format(new Date(trigger.last_run)');
    console.log('Partial match index:', idx);
    if (idx >= 0) {
      const snippet = content.substring(idx, idx + 120);
      console.log('Snippet chars:', [...snippet].map(c => c.charCodeAt(0)).join(','));
      console.log('Snippet:', snippet);
    }
  }
}
