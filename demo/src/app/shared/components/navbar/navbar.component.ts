import {
  ChangeDetectorRef,
  Component,
  Inject,
  LOCALE_ID,
  OnInit,
} from '@angular/core';
import { AuthService, UserIdTokenDecoded } from '@schoolbelle/api/auth';
import { startWith } from 'rxjs/operators';
import { AUTH_FRONT_HOST } from '@schoolbelle/api/tokens';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  subscription = new Subscription();
  constructor(
    private auth: AuthService,
    private cdRef: ChangeDetectorRef,
    @Inject(AUTH_FRONT_HOST) private authFrontHost: string,
    @Inject(LOCALE_ID) private localeId: string,
  ) {}
  user: UserIdTokenDecoded;
  ngOnInit() {
    this.subscription.add(
      this.auth.user.pipe(startWith(this.auth.currentUser)).subscribe(user => {
        this.user = user;
        this.cdRef.detectChanges();
      }),
    );
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  login() {
    const url = `${this.authFrontHost}/${this.localeId.slice(
      0,
      2,
    )}/login?return_uri=${window.location.href}`;
    window.location.replace(url);
  }
}
