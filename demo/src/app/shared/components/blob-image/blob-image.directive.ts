import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: 'img[blob]',
})
export class BlobImageDirective {
  @Input() blob: Blob;
  constructor(private elementRef: ElementRef) {}
  ngOnInit() {
    const img: HTMLImageElement = this.elementRef.nativeElement;
    const blob = this.blob;
    img.src = URL.createObjectURL(blob);
  }
}
