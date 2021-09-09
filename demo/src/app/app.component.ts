import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  DoCheck() {
    console.time('DoCheck application ticked');
  }
  OnChanges() {
    console.time('OnChanges application ticked');
  }
}
