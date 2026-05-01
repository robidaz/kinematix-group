import { Component, ViewChild } from '@angular/core';
import { TabModule, TabComponent } from '@syncfusion/ej2-angular-navigations';
import { EmailMemoComponent } from './tabs/email-memo/email-memo.component';
import { DesignRequirementsComponent } from './tabs/design-requirements/design-requirements.component';
import { VendorVaultComponent } from './tabs/vendor-vault/vendor-vault.component';
import { VendorAnalyticsComponent } from './tabs/vendor-analytics/vendor-analytics.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TabModule,
    EmailMemoComponent,
    DesignRequirementsComponent,
    VendorVaultComponent,
    VendorAnalyticsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('mainTab') mainTab!: TabComponent;

  readonly headerItems = [
    { text: 'Company Memo' },
    { text: 'Design Requirements' },
    { text: 'VendorVault' },
    { text: 'Analytics' },
  ];

  goToFirstTab(): void {
    this.mainTab?.select(0);
  }
}
