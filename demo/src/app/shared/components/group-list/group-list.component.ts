import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { UserToGroupService } from '@schoolbelle/api/user-to-group';
import { GroupService, GroupAccessTokenDecoded } from '@schoolbelle/api/group';

import { Subscription, merge, of } from 'rxjs';
import { debounceTime, filter, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '@schoolbelle/api/auth';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupListComponent implements OnInit {
  constructor(
    private auth: AuthService,
    public utg: UserToGroupService,
    private group: GroupService,
    private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}
  subscriptions = new Subscription();
  currentGroup: false | GroupAccessTokenDecoded;
  ngOnInit() {
    this.subscriptions.add(
      merge(this.route.params, this.route.queryParams)
        .pipe(
          map(({ group_id }) => group_id),
          filter(new_group_id => {
            const current_group_id =
              (this.group.currentGroup && this.group.currentGroup.gid) ||
              undefined;
            return current_group_id != new_group_id;
          }),
          switchMap(group_id => {
            console.log(group_id);
            if (group_id) {
              return this.group.checkIn(group_id);
            } else {
              this.group.flushAccessToken();
              return of(null);
            }
          }),
        )
        .subscribe(() => {
          this.cdRef.detectChanges();
        }),
    );

    this.subscriptions.add(
      merge(
        this.group.group.pipe(tap(group => (this.currentGroup = group))),
        this.utg.onChange,
      )
        .pipe(debounceTime(0))
        .subscribe(() => {
          this.cdRef.detectChanges();
        }),
    );
    this.subscriptions.add(
      this.auth.user
        .pipe(
          switchMap(user => {
            this.utg.empty();
            if (user) return this.utg.refresh();
            else return of(null);
          }),
        )
        .subscribe(),
    );
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  trackByUtgId(index, item) {
    return item.utg_id;
  }
}
