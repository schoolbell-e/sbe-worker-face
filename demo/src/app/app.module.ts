import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { NgxSpinnerModule } from "ngx-spinner";
import { NavbarModule } from './shared/components/navbar/navbar.module';
import { environment } from 'src/environments/environment';

import { TranslationModule } from '@schoolbelle/common/translation';
import { DialogModule } from '@schoolbelle/common/dialog';

import { SbeTokensModule } from '@schoolbelle/api/tokens';
import { AuthModule } from '@schoolbelle/api/auth';
import { UserToGroupModule } from '@schoolbelle/api/user-to-group';
import { GroupModule } from '@schoolbelle/api/group';
import { FileModule } from '@schoolbelle/api/file';

import { NgxSpinnerModule } from './shared/components/ngx-spinner/ngx-spinner.module';
import { GroupMemberModule } from '@schoolbelle/api/group-member';
import { BoardModule } from '@schoolbelle/api/board';
import { LetterToBoardModule } from '@schoolbelle/api/letter-to-board';
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,

    NavbarModule,

    SbeTokensModule.forRoot(environment),
    AuthModule.forRoot(),
    TranslationModule.forRoot(),
    DialogModule.forRoot(),
    UserToGroupModule.forRoot(),
    GroupModule.forRoot(),
    GroupMemberModule.forRoot(),
    BoardModule.forRoot(),
    LetterToBoardModule.forRoot(),
    FileModule.forRoot(),

    ToastrModule.forRoot({
      positionClass: 'toast-center-center',
    }),
  ],
  // schemas:[CUSTOM_ELEMENTS_SCHEMA], // ngx-spinner recommended
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
