import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FileInfoType } from '@schoolbelle/api/file';
import { GroupMember, GroupMemberService } from '@schoolbelle/api/group-member';
import { DialogService } from '@schoolbelle/common/dialog';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { FaceDetection, FaceRecognition, FaceService } from './face.service';
import { NgxSpinnerService } from 'src/app/shared/components/ngx-spinner/ngx-spinner.service';

@Component({
  selector: 'app-faces',
  templateUrl: './faces.component.html',
  styleUrls: ['./faces.component.scss'],
})
export class FacesComponent implements OnInit {
  @ViewChild('container') container: ElementRef;
  @Input() file: FileInfoType & { face_detected: any };
  detections: FaceDetection[] = [];
  members: GroupMember[] = [];
  constructor(
    private face: FaceService,
    private member: GroupMemberService,
    private dialogs: DialogService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private cdRef: ChangeDetectorRef,
  ) {}

  rect: any;
  ngOnInit(): void {
    this.getContainerRect().subscribe(rect => {
      this.rect = rect;
    });

    this.members = this.member.list.filter(m => m.member_type !== 'parent');
    if (this.file.face_detected) {
      this.refreshFaces().subscribe();
    }
  }

  refreshFaces() {
    return this.face.listDetections({ file_id: this.file.file_id }).pipe(
      tap(list => {
        this.detections = list;
        this.cdRef.detectChanges();
      }),
    );
  }

  getBoxPosition(box: {
    left: string;
    top: string;
    width: string;
    height: string;
  }) {
    return {
      position: 'absolute',
      ...box,
    };
  }
  getContainerRect() {
    return new Observable(ob => {
      const img = new Image();
      img.src = this.file.thumbnail || this.file.downsampled || this.file.url;
      img.onload = () => {
        const { width, height } = img;

        const frameHeight = this.container.nativeElement.clientHeight;
        ob.next({ width: `${(frameHeight * width) / height}px` });
      };
    });
  }
  getNameFromScope(scope: string): string {
    const matches = scope.match(/^[^_]+_(row_)?(.+)$/);
    return matches ? decodeURIComponent(matches[2]) : '-';
  }

  nullifyMatch(match: FaceRecognition) {
    this.dialogs
      .confirm('', 'Are you sure this is not the face?')
      .subscribe(bool => {
        if (!bool) return;
        this.spinner.show();
        return this.face
          .nullifyRecognition({ recognition_id: match.recognition_id })
          .pipe(
            switchMap(() => this.refreshFaces()),
            finalize(() => this.spinner.hide()),
          )
          .subscribe(
            () => {
              this.toastr.success('Successfully updated.');
            },
            e => {
              console.error(e);
              this.toastr.error(e.error || e.message);
            },
          );
      });
  }

  addReference(detection: FaceDetection, member: GroupMember) {
    const scope = this.member.turnMembertoScope(member);
    this.spinner.show();
    this.face
      .listReferences({ scope })
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe(list => {
        let text = '';
        if (list.length === 0) {
          text = 'Are you sure to add this face as a reference face?';
        } else if (list.length < 3) {
          text =
            'This member has already registered a face. Do you want to add another?';
        } else {
          text =
            'This member has already registered many faces. Adding another will take the old one(s) out of effect. Do you want to continue?';
        }
        this.dialogs.confirm('', text).subscribe(bool => {
          if (!bool) return;
          this.spinner.show();
          const descriptor = detection.descriptor;
          this.crop(detection.box, this.file.url)
            .pipe(
              switchMap(cropped => {
                return this.face.insertReference({
                  scope,
                  img: cropped,
                  descriptor,
                });
              }),
              switchMap(reference_id => {
                return this.face.insertRecognition({
                  file_id: this.file.file_id as any,
                  face_id: detection.face_id,
                  reference_id,
                });
              }),
              switchMap(() => this.refreshFaces()),
              finalize(() => this.spinner.hide()),
            )
            .subscribe(
              () => {
                this.toastr.success('Successfully added.');
              },
              e => {
                console.error(e);
                this.toastr.error(e.error || e.message);
              },
            );
        });
      });
  }

  private createCanvasWithSrc(src: string) {
    return new Observable<HTMLCanvasElement>(ob => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        ctx.drawImage(img, 0, 0);
        ob.next(canvas);
        ob.complete();
      };
      img.src = src;
    });
  }
  private crop(
    box: { left: string; top: string; width: string; height: string },
    src: string,
  ): Observable<Blob> {
    return this.createCanvasWithSrc(src).pipe(
      switchMap(canvas => {
        const perc_x = box.left;
        const perc_y = box.top;
        const perc_width = box.width;
        const perc_height = box.height;

        const x = (canvas.width * Number(perc_x.replace(/[^\d\.]/g, ''))) / 100;
        const y =
          (canvas.height * Number(perc_y.replace(/[^\d\.]/g, ''))) / 100;
        const width =
          (canvas.width * Number(perc_width.replace(/[^\d\.]/g, ''))) / 100;
        const height =
          (canvas.height * Number(perc_height.replace(/[^\d\.]/g, ''))) / 100;

        // create an in-memory canvas
        const buffer = document.createElement('canvas');
        const b_ctx = buffer.getContext('2d');
        // set its width/height to the required ones
        buffer.width = width;
        buffer.height = height;
        // draw the main canvas on our buffer one
        // drawImage(source, source_X, source_Y, source_Width, source_Height,
        //  dest_X, dest_Y, dest_Width, dest_Height)
        b_ctx.drawImage(
          canvas,
          x,
          y,
          width,
          height,
          0,
          0,
          buffer.width,
          buffer.height,
        );

        return new Observable<Blob>(ob => {
          buffer.toBlob(blob => {
            ob.next(blob);
            ob.complete();
          }, 'image/png');
        });
      }),
    );
  }
}
