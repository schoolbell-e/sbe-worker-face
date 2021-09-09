import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { FileInfoEvent, FileService } from '@schoolbelle/api/file';
import { GroupService } from '@schoolbelle/api/group';

import { REST_SERVER_HOST } from '@schoolbelle/api/tokens';
import { last, map, switchMap } from 'rxjs/operators';
import { convertArrayBufferToBase64 } from './convert-arrayBuffer-to-base64';
import { mapValues, pickBy, identity } from 'lodash-es';

export type FaceReference = {
  reference_id: string;
  group_id: any;
  scope: string;
  img: string;
  name: string;
  descriptor: Float32Array;
};
export type FaceRecognition = {
  recognition_id: string;
  distnace: number;
  reference_id: string;
  face_id: string;
  scope: string;
};
export type FaceDetection = {
  face_id: string;
  box: { left: string; top: string; width: string; height: string };
  file_id: string;
  matches: FaceRecognition[];
  score: number;
  descriptor: string | Float32Array;
};

@Injectable({
  providedIn: 'root',
})
export class FaceService {
  constructor(
    private http: HttpClient,
    private group: GroupService,
    private flie: FileService,
    @Inject(REST_SERVER_HOST) private serverHost: string,
  ) {}

  listReferences(params?: { scope?: string }) {
    const url = `${this.serverHost}/group/face/reference/list`;
    const httpParams = new HttpParams({
      fromObject: mapValues(pickBy(params, identity), v => '' + v),
    });

    return this.group.getAccessToken().pipe(
      switchMap(access_token => {
        return this.http.get<(FaceReference & { descriptor: string })[]>(url, {
          params: httpParams,
          headers: { Authorization: 'Bearer ' + access_token },
        });
      }),
      map(list =>
        list.map(li => ({
          ...li,
          descriptor:
            typeof li.descriptor === 'string' && li.descriptor.length > 512
              ? this.convertBase64ToFloat32Array(li.descriptor)
              : li.descriptor,
        })),
      ),
    );
  }

  deleteReference(params: { reference_id: string }) {
    const url = `${this.serverHost}/group/face/reference/delete`;
    return this.group.getAccessToken().pipe(
      switchMap(access_token => {
        return this.http.post(url, params, {
          headers: { Authorization: 'Bearer ' + access_token },
        });
      }),
    );
  }
  private convertFloat32ArrayToBase64(data: Float32Array): string {
    return convertArrayBufferToBase64(data.buffer);
  }
  private convertBase64ToFloat32Array(base64: string): Float32Array {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const buffer = bytes.buffer;
    return new Float32Array(buffer);
  }
  private blobToFile(theBlob: Blob, fileName: string): File {
    const b: any = theBlob;
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    b.lastModifiedDate = new Date();
    b.name = fileName;

    //Cast to a File() type
    return <File>theBlob;
  }
  insertReference(params: {
    scope: string;
    img: Blob;
    descriptor: string | Float32Array;
  }) {
    const url = `${this.serverHost}/group/face/reference/insert`;
    return this.group.getAccessToken().pipe(
      switchMap(access_token => {
        return this.flie
          .upload(
            this.blobToFile(params.img, 'face.png'),
            { private: true },
            access_token,
          )
          .pipe(
            last(),
            map((e: FileInfoEvent) => {
              return e.data.url;
            }),
            switchMap(img => {
              return this.http.post(
                url,
                {
                  ...params,
                  img,
                  descriptor:
                    typeof params.descriptor === 'string'
                      ? params.descriptor
                      : this.convertFloat32ArrayToBase64(params.descriptor),
                },
                {
                  headers: { Authorization: 'Bearer ' + access_token },
                  responseType: 'text',
                },
              );
            }),
          );
      }),
    );
  }

  listDetections(params: { file_id: any }) {
    const url = `${this.serverHost}/group/face/detected/list`;
    const httpParams = new HttpParams({
      fromObject: mapValues(pickBy(params, identity), v => '' + v),
    });

    return this.group.getAccessToken().pipe(
      switchMap(access_token => {
        return this.http.get<FaceDetection[]>(url, {
          params: httpParams,
          headers: { Authorization: 'Bearer ' + access_token },
        });
      }),
      // temp fix
      map(list =>
        list.map(li => ({
          ...li,
          box: typeof li.box === 'string' ? JSON.parse(li.box as any) : li.box,
        })),
      ),
      // temp fix
    );
  }
  insertRecognition(params: {
    file_id: string;
    face_id: string;
    reference_id?: string;
    scope?: string;
  }) {
    const url = `${this.serverHost}/group/face/recognition/insert`;
    return this.group.getAccessToken().pipe(
      switchMap(access_token => {
        return this.http.post(
          url,
          { ...params, distance: 0 },
          {
            headers: { Authorization: 'Bearer ' + access_token },
            responseType: 'text',
          },
        );
      }),
    );
  }
  nullifyRecognition(params: { recognition_id: string }) {
    const url = `${this.serverHost}/group/face/recognition/nullify`;
    return this.group.getAccessToken().pipe(
      switchMap(access_token => {
        return this.http.post(url, params, {
          headers: { Authorization: 'Bearer ' + access_token },
          responseType: 'text',
        });
      }),
    );
  }
}
