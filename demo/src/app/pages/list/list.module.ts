import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ListRoutingModule } from './list-routing.module';
import { ListComponent } from './list.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { FacesModule } from './faces/faces.module';

@NgModule({
  declarations: [ListComponent],
  imports: [
    CommonModule,
    ListRoutingModule,
    VirtualScrollerModule,
    FacesModule,
  ],
})
export class ListModule {}
