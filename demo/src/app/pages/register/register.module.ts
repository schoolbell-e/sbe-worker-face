import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegisterRoutingModule } from './register-routing.module';
import { RegisterComponent } from './register.component';

import { PopoverModule } from 'ngx-bootstrap/popover';
import { WebcamModule } from './webcam/webcam.module';
import { SelectFacesModalModule } from './select-faces-modal/select-faces-modal.module';
import { ngfModule } from 'angular-file';
import { BlobImageModule } from 'src/app/shared/components/blob-image/blob-image.module';

@NgModule({
  declarations: [RegisterComponent],
  imports: [
    CommonModule,
    RegisterRoutingModule,

    PopoverModule.forRoot(),

    WebcamModule,
    SelectFacesModalModule,
    ngfModule,
    BlobImageModule,
  ],
})
export class RegisterModule {}
