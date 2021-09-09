import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectFacesModalComponent } from './select-faces-modal.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SelectFacesModalService } from './select-faces-modal.service';
import { BlobImageModule } from 'src/app/shared/components/blob-image/blob-image.module';

@NgModule({
  declarations: [SelectFacesModalComponent],
  imports: [CommonModule, ModalModule.forRoot(), BlobImageModule],
  providers: [SelectFacesModalService],
  entryComponents: [SelectFacesModalComponent],
})
export class SelectFacesModalModule {}
