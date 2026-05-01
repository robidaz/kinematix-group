import { bootstrapApplication } from '@angular/platform-browser';
import { registerLicense } from '@syncfusion/ej2-base';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// The Syncfusion license is shipped as a static asset at runtime so the same
// build can be deployed in any environment. The text file lives at the project
// root and is also copied into src/assets/config/ for the browser to fetch.
async function loadSyncfusionLicense(): Promise<void> {
  const sources = [
    '/api/config/syncfusion-key',          // Heroku: served by server.js from Config Var
    'assets/config/syncfusion_api_key.txt', // local ng serve: static asset file
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const key = (await res.text()).trim();
      if (key && !key.startsWith('REPLACE_')) {
        registerLicense(key);
        return;
      }
    } catch { /* try next source */ }
  }
}

loadSyncfusionLicense().finally(() => {
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err),
  );
});
