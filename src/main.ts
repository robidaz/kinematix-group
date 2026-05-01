import { bootstrapApplication } from '@angular/platform-browser';
import { registerLicense } from '@syncfusion/ej2-base';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// The Syncfusion license is shipped as a static asset at runtime so the same
// build can be deployed in any environment. The text file lives at the project
// root and is also copied into src/assets/config/ for the browser to fetch.
async function loadSyncfusionLicense(): Promise<void> {
  try {
    const response = await fetch('/api/config/syncfusion-key');
    if (!response.ok) return;
    const key = (await response.text()).trim();
    if (key && !key.startsWith('REPLACE_')) {
      registerLicense(key);
    }
  } catch {
    // license file missing — Syncfusion will show a banner but app still works
  }
}

loadSyncfusionLicense().finally(() => {
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err),
  );
});
