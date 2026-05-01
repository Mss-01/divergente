import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { NewEntryModalComponent } from '../../components/new-entry-modal/new-entry-modal.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, NewEntryModalComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">
      <app-sidebar />
      <div class="flex flex-col flex-1 ml-64 overflow-hidden">
        <app-topbar />
        <main class="flex-1 overflow-auto pt-16">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Global New Entry Modal — available on every route -->
    <app-new-entry-modal />
  `,
})
export class MainLayoutComponent {}
