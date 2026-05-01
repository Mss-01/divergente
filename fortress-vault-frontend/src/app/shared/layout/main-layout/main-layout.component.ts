import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { NewEntryModalComponent } from '../../components/new-entry-modal/new-entry-modal.component';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, BottomNavComponent, NewEntryModalComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">

      <!-- Sidebar — hidden on mobile via width:0, shown on desktop -->
      <app-sidebar />

      <!-- Content area -->
      <div class="flex flex-col flex-1 overflow-hidden transition-all duration-300"
           [style.margin-left]="sidebar.isOpen() ? '256px' : '0px'">
        <app-topbar />
        <!-- Extra bottom padding on mobile for bottom nav -->
        <main class="flex-1 overflow-auto pt-16 pb-0 md:pb-0"
              [class.pb-20]="true">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Bottom Navigation — mobile only -->
    <app-bottom-nav />

    <!-- Global New Entry Modal -->
    <app-new-entry-modal />
  `,
})
export class MainLayoutComponent {
  sidebar = inject(SidebarService);
}
