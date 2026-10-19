// Capacitor 8 targets Java 21; force Java 17 so the build works with JDK 17.
import fs from 'node:fs';
for (const f of ['node_modules/@capacitor/android/capacitor/build.gradle', 'android/app/capacitor.build.gradle']) {
  if (fs.existsSync(f)) fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replaceAll('VERSION_21', 'VERSION_17'));
}
