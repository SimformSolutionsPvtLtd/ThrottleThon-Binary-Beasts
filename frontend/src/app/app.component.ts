import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

@Component({
  selector: 'ss-root',
  standalone: true,
  imports: [RouterOutlet, ShellComponent],
  template: `<ss-shell><router-outlet /></ss-shell>`,
})
export class AppComponent {}
