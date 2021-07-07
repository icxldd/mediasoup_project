/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RoomV4Component } from './room-v4.component';

describe('RoomV4Component', () => {
  let component: RoomV4Component;
  let fixture: ComponentFixture<RoomV4Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomV4Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomV4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
