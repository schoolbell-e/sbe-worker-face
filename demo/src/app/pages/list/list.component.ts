import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { GroupService } from '@schoolbelle/api/group';
import {
  LetterOnBoard,
  LetterToBoardService,
} from '@schoolbelle/api/letter-to-board';
import { map, startWith, switchMap } from 'rxjs/operators';
import { InfiniteListService } from '@schoolbelle/common/infinite-list';
import { BoardService } from '@schoolbelle/api/board';
import { IPageInfo } from 'ngx-virtual-scroller';
import { flatten } from '@angular/compiler';
import { FileInfoType } from '@schoolbelle/api/file';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [InfiniteListService],
})
export class ListComponent implements OnInit {
  list: FileInfoType[] = [];
  constructor(
    private group: GroupService,
    private board: BoardService,
    private ltb: LetterToBoardService,
    public infinite: InfiniteListService,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.group.group
      .pipe(
        startWith(this.group.currentGroup),
        switchMap(group => {
          console.log(group);
          return this.board.checkIn(`${this.group.currentGroup.gid}|photo`);
        }),
        switchMap(() => {
          return this.createList();
        }),
        map(list =>
          flatten(
            list.map(li =>
              (li.files || []).filter(
                li => li.type.match(/image/) && li.face_detected,
              ),
            ),
          ),
        ),
      )
      .subscribe(list => {
        const old_length = this.list.length,
          new_length = list.length;
        this.list.splice(0, this.list.length);
        list.forEach(li => this.list.push(li));
        this.cdRef.detectChanges();

        if (new_length < old_length + 10) this.infinite.scrollHasHitBottom();
      });
  }

  createList() {
    this.infinite.flush();
    return this.infinite.getListObservable<LetterOnBoard>(
      this.ltb.loadMore.bind(this.ltb),
      'ltg_id',
      {},
      { inital_run: true },
    );
  }
  scrollHasHitBottom($event: IPageInfo) {
    if ($event.endIndexWithBuffer !== this.list.length - 1) return;
    this.infinite.scrollHasHitBottom();
  }

  trackByFileId(index: number, li: FileInfoType) {
    return li.file_id;
  }
}
