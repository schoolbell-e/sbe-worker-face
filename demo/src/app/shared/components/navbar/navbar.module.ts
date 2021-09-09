import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar.component';
import { RouterModule } from '@angular/router';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { GroupListModule } from '../group-list/group-list.module';

@NgModule({
  declarations: [NavbarComponent],
  imports: [
    CommonModule,
    RouterModule,
    BsDropdownModule.forRoot(),

    GroupListModule,
  ],
  exports: [NavbarComponent],
})
export class NavbarModule {}
