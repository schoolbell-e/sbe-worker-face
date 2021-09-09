import { Injectable } from '@angular/core';
import { FaceDetection } from 'face-api.js';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Face } from 'src/app/shared/services/face-detection/face-detection.service';
import { SelectFacesModalComponent } from './select-faces-modal.component';
@Injectable({
  providedIn: 'root',
})
export class SelectFacesModalService {
  constructor(private modal: BsModalService) {}
  open(
    list: { img: Blob; descriptor: Float32Array }[],
  ): Observable<{ img: Blob; descriptor: Float32Array }[] | false> {
    const modal: BsModalRef = this.modal.show(SelectFacesModalComponent, {
      initialState: { list },
    });
    return modal.content.action.pipe(take(1));
  }
}
