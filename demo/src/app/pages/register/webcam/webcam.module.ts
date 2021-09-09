import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcamComponent } from './webcam.component';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'src/app/shared/components/ngx-spinner/ngx-spinner.module';

@NgModule({
  declarations: [WebcamComponent],
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  exports: [WebcamComponent],
})
export class WebcamModule {}
