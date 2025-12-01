import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEventsPage } from './create-events-page';

describe('CreateEventsPage', () => {
  let component: CreateEventsPage;
  let fixture: ComponentFixture<CreateEventsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEventsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEventsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
