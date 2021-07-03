/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RoomV2Component } from './room-v2.component';

describe('RoomV2Component', () => {
  let component: RoomV2Component;
  let fixture: ComponentFixture<RoomV2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoomV2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
