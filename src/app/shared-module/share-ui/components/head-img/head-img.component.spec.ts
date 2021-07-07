/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HeadImgComponent } from './head-img.component';

describe('HeadImgComponent', () => {
  let component: HeadImgComponent;
  let fixture: ComponentFixture<HeadImgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HeadImgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeadImgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
