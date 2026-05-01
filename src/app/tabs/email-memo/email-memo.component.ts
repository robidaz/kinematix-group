import { Component } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-email-memo',
  standalone: true,
  imports: [MarkdownModule],
  templateUrl: './email-memo.component.html',
  styleUrl: './email-memo.component.scss',
})
export class EmailMemoComponent {
  readonly meta = {
    from: 'Zach Robida, Lead AI Solutions Architect — KineMatix Group',
    fromEmail: 'zach.robida@kinematixgroup.com',
    to: 'KineMatix Group — All Staff',
    toEmail: 'all-staff@kinematixgroup.com',
    subject: 'Introducing VendorVault: Centralizing Our Vendor Intelligence',
    date: this.buildTimestamp(),
  };

  private buildTimestamp(): string {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    return oneHourAgo.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}
