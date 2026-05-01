import { Component, ViewChild } from '@angular/core';
import { TabModule, TabComponent } from '@syncfusion/ej2-angular-navigations';
import { EmailMemoComponent } from './tabs/email-memo/email-memo.component';
import { DesignRequirementsComponent } from './tabs/design-requirements/design-requirements.component';
import { VendorVaultComponent } from './tabs/vendor-vault/vendor-vault.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TabModule,
    EmailMemoComponent,
    DesignRequirementsComponent,
    VendorVaultComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('mainTab') mainTab!: TabComponent;

  readonly headerItems = [
    { text: 'Release Notes' },
    { text: 'Design Requirements' },
    { text: 'VendorVault' },
  ];

  goToFirstTab(): void {
    this.mainTab?.select(0);
  }
}
