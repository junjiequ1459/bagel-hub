const fs = require('fs');

const transcriptPath = '/Users/user/.gemini/antigravity-ide/brain/301c0a36-37a7-40b2-b5a6-8351b9f16b45/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.name === 'write_to_file') {
          const target = call.args.TargetFile;
          if (target && target.includes('/apps/weather/')) {
            console.log('Found write:', target);
            if (!target.endsWith('weather.ts') && !target.endsWith('fix.cjs') && !target.endsWith('phase2.cjs')) {
              const content = call.args.CodeContent;
              const dir = target.substring(0, target.lastIndexOf('/'));
              fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(target, content);
            }
          }
        }
      }
    }
  } catch(e) {}
}

console.log('Recovery complete');
