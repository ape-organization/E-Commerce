import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { CartService } from '../../services/cart.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let cartService: jasmine.SpyObj<CartService>;

  beforeEach(async () => {
    const cartServiceSpy = jasmine.createSpyObj('CartService', [], {
      cartCount$: of(0)
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterModule.forRoot([])],
      providers: [
        { provide: CartService, useValue: cartServiceSpy }
      ]
    }).compileComponents();

    cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize cartCount to 0', () => {
    expect(component.cartCount).toBe(0);
  });

  it('should subscribe to cartCount$ on init', () => {
    fixture.detectChanges();
    expect(component.cartCount).toBe(0);
  });

  it('should update cartCount when cartService emits', (done) => {
    const testCount = 5;
    const cartServiceSpy = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
    (Object.getOwnPropertyDescriptor(cartServiceSpy, 'cartCount$')?.get as any)
      .and.returnValue(of(testCount));

    component.ngOnInit();
    fixture.detectChanges();

    setTimeout(() => {
      expect(component.cartCount).toBe(testCount);
      done();
    }, 0);
  });

  it('should unsubscribe on destroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
