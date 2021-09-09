import { Injectable } from '@angular/core';
import * as faceapi from 'face-api.js';
import { FaceDetection, WithFaceLandmarks } from 'face-api.js';
import { defaults } from 'lodash-es';
import { combineLatest, from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

type FaceDetectorType = 'ssd_mobilenetv1' | 'tiny_face_detector';
const SSD_MOBILENETV1: FaceDetectorType = 'ssd_mobilenetv1';
const TINY_FACE_DETECTOR: FaceDetectorType = 'tiny_face_detector';

type SsdMobilenetV1Options = {
  minConfidence: number;
};
type TinyFaceDetectorOptions = {
  inputSize: number;
  scoreThreshold: number;
};

const DefaultSsdMobilenetV1Options: SsdMobilenetV1Options = {
  minConfidence: 0.5,
};
const DefaultTinyFaceDetectorOptions: TinyFaceDetectorOptions = {
  inputSize: 512,
  scoreThreshold: 0.5,
};
export type Face = faceapi.WithFaceDescriptor<
  WithFaceLandmarks<{ detection: FaceDetection }>
>;

@Injectable({
  providedIn: 'root',
})
export class FaceDetectionService {
  canvas: HTMLCanvasElement;
  constructor() {
    const canvas = document.createElement('canvas');
    (canvas.width = 640), (canvas.height = 480);
    this.canvas = canvas;

    faceapi
      .loadFaceLandmarkModel('/assets/face-api.js/weights/')
      .then(() => console.log('landmark module loaded'));
    faceapi
      .loadFaceRecognitionModel('/assets/face-api.js/weights/')
      .then(() => console.log('recognition module loaded'));
    this.loadDetector().subscribe();
  }

  private getFaceDetectorOptions(
    selectedFaceDetector: FaceDetectorType,
    opts: Partial<SsdMobilenetV1Options | TinyFaceDetectorOptions> = {},
  ) {
    return selectedFaceDetector === SSD_MOBILENETV1
      ? new faceapi.SsdMobilenetv1Options(
          defaults(opts, DefaultSsdMobilenetV1Options),
        )
      : new faceapi.TinyFaceDetectorOptions(
          defaults(opts, DefaultTinyFaceDetectorOptions),
        );
  }
  private getCurrentFaceDetectionNet(selectedFaceDetector: FaceDetectorType) {
    if (selectedFaceDetector === SSD_MOBILENETV1) {
      return faceapi.nets.ssdMobilenetv1;
    }
    if (selectedFaceDetector === TINY_FACE_DETECTOR) {
      return faceapi.nets.tinyFaceDetector;
    }
  }
  private isFaceDetectionModelLoaded(
    selectedFaceDetector: FaceDetectorType,
  ): boolean {
    return !!this.getCurrentFaceDetectionNet(selectedFaceDetector).params;
  }

  private loading: { [key: string]: Promise<any> } = {};
  public loadDetector(
    selectedFaceDetector: FaceDetectorType = 'ssd_mobilenetv1',
  ): Observable<any> {
    if (!this.isFaceDetectionModelLoaded(selectedFaceDetector)) {
      if (!this.loading[selectedFaceDetector]) {
        this.loading[selectedFaceDetector] = this.getCurrentFaceDetectionNet(
          selectedFaceDetector,
        )
          .load('/assets/face-api.js/weights/')
          .then(() => {
            delete this.loading[selectedFaceDetector];
            console.log(`${selectedFaceDetector} module is loaded`);
          });
      }
      return from(this.loading[selectedFaceDetector]);
    } else {
      return of(null);
    }
  }
  /**
   *
   * @param minConfidence ssd_mobilenetv1 options
   * @param inputSize tiny_face_detector options
   * @param scoreThreshold tiny_face_detector options
   */
  detect(
    src: CanvasImageSource,
    selectedFaceDetector: FaceDetectorType = 'ssd_mobilenetv1',
    opts: Partial<SsdMobilenetV1Options | TinyFaceDetectorOptions> = {},
  ): Observable<{ descriptor: Float32Array; img: Blob }[]> {
    this.draw(src);
    return this.loadDetector(selectedFaceDetector).pipe(
      switchMap(() => {
        const options = this.getFaceDetectorOptions(selectedFaceDetector, opts);
        return new Promise((res: (list: Face[]) => any) => {
          faceapi
            .detectAllFaces(this.canvas, options)
            .withFaceLandmarks()
            .withFaceDescriptors()
            .then(results => res(results));
        });
      }),
      switchMap(faces => {
        if (!faces.length) return of([]);
        setTimeout(() => {});
        return combineLatest(
          faces.map(face => {
            return this.crop(face.detection.box);
          }),
        ).pipe(
          map(blobs =>
            blobs.map((blob, index) => {
              return { img: blob, descriptor: faces[index].descriptor };
            }),
          ),
        );
      }),
    );
  }

  private crop(
    box: { x: number; y: number; width: number; height: number },
    canvas: HTMLCanvasElement = this.canvas,
  ): Observable<Blob> {
    const { x, y, width, height } = box;
    // const offsetX:number = face, offsetY:number, width:number, height:number
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

    return new Observable(ob => {
      buffer.toBlob(blob => {
        ob.next(blob);
        ob.complete();
      }, 'image/png');
    });
    // return buffer.toDataURL();
  }

  private draw(src: CanvasImageSource) {
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.drawImage(src, 0, 0, this.canvas.width, this.canvas.height);
  }
}
