import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { NEVER, Observable } from 'rxjs';
import { map, share, switchMap } from 'rxjs/operators';
import { AuthService } from '@schoolbelle/api/auth';
import { GroupService } from '@schoolbelle/api/group';
import { GroupMemberService } from '@schoolbelle/api/group-member';
import { DialogService } from '@schoolbelle/common/dialog';
import { UserToGroupService } from '@schoolbelle/api/user-to-group';

@Injectable({
  providedIn: 'root',
})
export class AppGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private utg: UserToGroupService,
    private router: Router,
    private group: GroupService,
    private member: GroupMemberService,
    private dialogs: DialogService,
  ) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    const group_id = next.params.group_id || next.queryParams.group_id;
    const ob = this.auth.fetchUser().pipe(
      switchMap(user => {
        if (!user) {
          console.error('Login first');
          return NEVER;
        }
        return this.utg.refresh();
      }),
      switchMap(() => {
        if (!group_id) {
          return this.dialogs
            .select(
              'Choose a class first.',
              this.utg.list.map(
                li =>
                  `${li.school_name ? li.school_name : ''} ${li.group_name}`,
              ),
            )
            .pipe(
              switchMap(i => {
                const group = this.utg.list[i];
                console.log(state.url, {
                  queryParams: { group_id: group.group_id },
                  queryParamsHandling: 'merge',
                });
                this.router.navigate([state.url], {
                  queryParams: { group_id: group.group_id },
                  queryParamsHandling: 'merge',
                });
                return NEVER;
              }),
            );
        } else {
          return this.group.checkIn(group_id);
        }
      }),
      switchMap(() => {
        return this.member.checkIn();
        // return this.member.checkInMine();
      }),
      map(() => true),
      share(),
    );
    return ob;
  }
}
