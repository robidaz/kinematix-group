import { Component } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-design-requirements',
  standalone: true,
  imports: [MarkdownModule],
  templateUrl: './design-requirements.component.html',
  styleUrl: './design-requirements.component.scss',
})
export class DesignRequirementsComponent {}
