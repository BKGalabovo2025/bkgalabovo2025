const fs = require('fs');
['src/types/member.types.ts', 'src/components/reservations/donation-receipt-dialog.tsx', 'src/app/(protected)/settings/SettingsClient.tsx', 'src/lib/actions/reservations.ts'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /<<<<<<<[\s\S]*?>>>>>>>[^\n]*/g;
  const matches = content.match(regex);
  console.log(`\n\n--- CONFLICTS IN ${file} ---`);
  if (matches) {
    matches.forEach((m, i) => console.log(`\nConflict ${i + 1}:\n${m}`));
  } else {
    console.log('None found?!');
  }
});
