import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupListComponent } from './group-list.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [CommonModule, BsDropdownModule.forRoot(), RouterModule],
  declarations: [GroupListComponent],
  exports: [GroupListComponent],
})
export class GroupListModule {}
