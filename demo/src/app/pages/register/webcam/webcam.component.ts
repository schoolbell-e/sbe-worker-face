import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { from, Observable, of, throwError } from 'rxjs';
import { map, share, switchMap, tap } from 'rxjs/operators';
import { NgxSpinnerService } from 'src/app/shared/components/ngx-spinner/ngx-spinner.service';

@Component({
  selector: 'app-webcam',
  templateUrl: './webcam.component.html',
  styleUrls: ['./webcam.component.scss'],
})
export class WebcamComponent implements OnInit {
  @ViewChild('video') public video: ElementRef;
  @Output() onCapture = new EventEmitter<HTMLVideoElement>();

  public ready = false;
  public error: string = null;
  public currentDeviceId: string;
  public mediaDeviceInfoList: MediaDeviceInfo[] = [];
  constructor(
    private cdRef: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
  ) {}

  public ngOnInit() {}

  public ngAfterViewInit() {
    this.spinner.show('webcam');
    this.setVideoStreamSource()
      .pipe(
        switchMap(() => {
          return this.getAvailableVideoStreamSources();
        }),
      )
      .subscribe(
        () => {
          this.spinner.hide('webcam');
          this.ready = true;
          this.cdRef.detectChanges();
        },
        (e: Error) => {
          console.error(e);
          this.spinner.hide('webcam');
          this.error = e.message;
          this.cdRef.detectChanges();
        },
      );
  }
  ngOnDestroy() {
    const video: HTMLVideoElement = this.video.nativeElement;
    video.pause();

    if (video.srcObject instanceof MediaStream) {
      const tracks = video.srcObject.getTracks();
      tracks[0].stop();
    }
  }

  private getAvailableVideoStreamSources(): Observable<MediaDeviceInfo[]> {
    let ob: Observable<any>;
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      ob = from(navigator.mediaDevices.enumerateDevices())
        .pipe(map(list => list.filter(li => li.kind === 'videoinput')))
        .pipe(
          tap(list => {
            this.mediaDeviceInfoList = list;
          }),
        );
    } else {
      ob = of([]);
    }
    ob = ob.pipe(share());
    ob.subscribe();
    return ob;
  }

  public setVideoStreamSource(deviceId?: string): Observable<string> {
    let ob: Observable<any>;
    if (deviceId && this.currentDeviceId === deviceId)
      ob = of(this.currentDeviceId);
    else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      ob = from(
        navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        }),
      ).pipe(
        map(stream => {
          const video: HTMLVideoElement = this.video.nativeElement;
          video.pause();
          if (typeof video.srcObject !== 'undefined') {
            try {
              video.srcObject = null;
              video.srcObject = stream;
            } catch (err) {
              if (err.name != 'TypeError') {
                throw err;
              }
              // Even if they do, they may only support MediaStream
              video.src = null;
              video.src = URL.createObjectURL(stream);
            }
          } else {
            video.src = null;
            video.src = URL.createObjectURL(stream);
          }
          video.play();
          this.currentDeviceId = stream
            .getVideoTracks()[0]
            .getCapabilities().deviceId;
          return this.currentDeviceId;
        }),
      );
    } else {
      ob = throwError(new Error('Not supported feature by your browser.'));
    }

    ob = ob.pipe(share());
    ob.subscribe();
    return ob;
  }

  public capture() {
    const video: HTMLVideoElement = this.video.nativeElement;
    this.onCapture.next(video);
  }
}
