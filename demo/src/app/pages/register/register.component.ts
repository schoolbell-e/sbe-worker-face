import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { combineLatest, of, throwError } from 'rxjs';
import { delay, switchMap, tap } from 'rxjs/operators';
import { SelectFacesModalService } from './select-faces-modal/select-faces-modal.service';
// import { NgxSpinnerService } from "ngx-spinner";
import { PopoverDirective } from 'ngx-bootstrap/popover';
import { FaceDetectionService } from 'src/app/shared/services/face-detection/face-detection.service';
import { NgxSpinnerService } from 'src/app/shared/components/ngx-spinner/ngx-spinner.service';
import {
  FaceReference,
  FaceService,
} from 'src/app/shared/services/face/face.service';
import { DialogService } from '@schoolbelle/common/dialog';
import { GroupMemberService } from '@schoolbelle/api/group-member';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  @ViewChild('webcamPopover') webcamPopover: PopoverDirective;
  showWebcam = false;
  public face_reference_list: Array<FaceReference> = [];
  constructor(
    private faceDetection: FaceDetectionService,
    private faceReference: FaceService,
    private selectFacesModal: SelectFacesModalService,
    private member: GroupMemberService,
    private dialogs: DialogService,
    private spinner: NgxSpinnerService,
    private cdRef: ChangeDetectorRef,
  ) {}

  public ngOnInit() {
    this.refreshList().subscribe();
  }

  public onUpload(file: File) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = function() {
      URL.revokeObjectURL(img.src);
    };
    this.onCapture(img);
  }

  public onCapture(src: CanvasImageSource) {
    this.spinner.show();
    of(null)
      .pipe(
        delay(100),
        switchMap(() => {
          return this.faceDetection.detect(src);
        }),
        switchMap(list => {
          if (list.length === 0) {
            return throwError(
              new Error(
                'Seems like we have failed to detect a face from the image. Try again please.',
              ),
            );
          }
          this.spinner.hide();
          return this.selectFacesModal.open(list);
        }),
      )
      .subscribe(
        selected => {
          if (!selected) return;
          selected.forEach(li => {
            if (
              this.face_reference_list.find(
                reference => reference.descriptor === li.descriptor,
              )
            )
              return;
            this.add(li);
          });
          if (this.webcamPopover && this.webcamPopover.isOpen)
            this.webcamPopover.hide();
          this.cdRef.detectChanges();
        },
        (e: Error) => {
          this.spinner.hide();
          alert(e.message);
        },
      );
  }
  public remove(index: number) {
    if (
      !confirm(
        'Do you want to remove this face and all the associated face matches?',
      )
    )
      return;

    const reference = this.face_reference_list[index];

    this.face_reference_list.splice(index, 1);
    this.cdRef.detectChanges();

    this.faceReference
      .deleteReference({ reference_id: reference.reference_id })
      .subscribe();
  }
  public add(reference: {
    descriptor: Float32Array;
    img: Blob | string;
    name?: string;
    reference_id?: number;
  }) {
    const members = this.member.mine.filter(m => m.member_type !== 'parent');
    this.dialogs
      .select(
        'Whose face is this?',
        members.map(m => `${m.member_name}`),
      )
      .pipe(
        switchMap(i => {
          const member = members[i];
          if (!member) throwError(new Error('Canceled.'));

          return this.faceReference.insertReference({
            scope: `${
              member.member_type === 'student'
                ? 'studentparent'
                : member.member_type
            }_row_${encodeURIComponent(member.member_name)}`,
            img: reference.img as Blob,
            descriptor: reference.descriptor,
          });
        }),
        switchMap(() => this.refreshList()),
      )
      .subscribe();
  }
  public refreshList() {
    return this.faceReference.listReferences().pipe(
      tap(list => {
        this.face_reference_list = list.map(li => {
          return { ...li, name: this.getNameFromScope(li.scope) };
        });
        this.cdRef.detectChanges();
      }),
    );
  }
  getNameFromScope(scope: string): string {
    const matches = scope.match(/^[^_]+_(row_)?(.+)$/);
    return matches ? decodeURIComponent(matches[2]) : '-';
  }
}
