// import { async, ComponentFixture, TestBed } from '@angular/core/testing';

// import { GroupListComponent } from './group-list.component';
// import { NO_ERRORS_SCHEMA } from '@angular/core';
// import { GroupService } from '@schoolbelle/common/services/group';
// import { Observable } from 'rxjs';

// describe('GroupListComponent', () => {
//   let component: GroupListComponent;
//   let fixture: ComponentFixture<GroupListComponent>;
//   let groupServiceStub = {
//     group:{id:1, info:{group_name:'group_name'}, tabs:'schoolnews'},
//     onChange : Observable.of({id:1, info:{group_name:'group_name'}, tabs:'schoolnews'}),
//   };

//   beforeEach(
//     async(() => {
//       TestBed.configureTestingModule({
//         declarations: [GroupListComponent],
//         providers: [
//           {provide:GroupService, useValue:groupServiceStub}
//         ],
//         schemas: [NO_ERRORS_SCHEMA],
//       }).compileComponents();
//     })
//   );

//   beforeEach(() => {
//     fixture = TestBed.createComponent(GroupListComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });
