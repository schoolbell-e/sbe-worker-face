import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacesComponent } from './faces.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

@NgModule({
  declarations: [FacesComponent],
  imports: [CommonModule, BsDropdownModule.forRoot()],
  exports: [FacesComponent],
})
export class FacesModule {}
