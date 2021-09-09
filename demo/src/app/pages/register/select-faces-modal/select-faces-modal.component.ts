import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-select-faces-modal',
  templateUrl: './select-faces-modal.component.html',
  styleUrls: ['./select-faces-modal.component.scss'],
})
export class SelectFacesModalComponent implements OnInit {
  action: EventEmitter<any> = new EventEmitter();
  @Input() list: { img: Blob; descriptor: Float32Array }[] = [];
  selected: { img: Blob; descriptor: Float32Array }[] = [];

  constructor(public modalRef: BsModalRef) {}

  ngOnInit(): void {
    if (this.list.length === 1) {
      this.toggle(this.list[0]);
    }
  }

  isChecked(li: { img: Blob; descriptor: Float32Array }) {
    const index = this.selected.indexOf(li);
    return index !== -1;
  }
  toggle(li: { img: Blob; descriptor: Float32Array }) {
    const index = this.selected.indexOf(li);
    if (index === -1) {
      this.selected.push(li);
    } else {
      this.selected.splice(index, 1);
    }
  }

  ok() {
    this.modalRef.hide();
    this.action.emit(this.selected);
  }
  cancel() {
    this.modalRef.hide();
    this.action.emit(false);
  }
}
