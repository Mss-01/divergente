import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { NewEntryModalComponent } from '../../components/new-entry-modal/new-entry-modal.component';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, NewEntryModalComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">

      <!-- Sidebar -->
      <app-sidebar />

      <!-- Content area — shifts right when sidebar is open -->
      <div class="flex flex-col flex-1 overflow-hidden transition-all duration-300"
           [style.margin-left]="sidebar.isOpen() ? '256px' : '0px'">
        <app-topbar />
        <main class="flex-1 overflow-auto pt-16">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Global New Entry Modal -->
    <app-new-entry-modal />
  `,
})
export class MainLayoutComponent {
  sidebar = inject(SidebarService);
}
