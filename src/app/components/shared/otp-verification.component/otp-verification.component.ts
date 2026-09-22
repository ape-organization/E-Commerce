import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { OtpService } from '../../../services/otp.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotifyMessage } from '../notify-message/notify-message';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-otp-verification',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe
  ],

  templateUrl: './otp-verification.component.html',
  styleUrl: './otp-verification.component.scss',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OtpVerificationComponent
  implements OnInit, OnDestroy {

  private readonly fb = inject(FormBuilder);
  private readonly otpService = inject(OtpService);
  private readonly cdr = inject(ChangeDetectorRef);
private readonly dialogRef =
  inject(MatDialogRef<OtpVerificationComponent>);

private readonly data =
  inject<any>(MAT_DIALOG_DATA);
  private timer?: ReturnType<typeof setInterval>;

  readonly phoneNumber = signal('');
  readonly isLoading = signal(false);
  readonly isResending = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly attemptsRemaining = signal(5);
  readonly secondsRemaining = signal(60);

  readonly canResend = signal(false);


  readonly otpForm = this.fb.group({
  otp: [
    '',
    [
      Validators.required,
      Validators.pattern(/^\d{6}$/)
    ]
  ]
});


  ngOnInit(): void {

    this.phoneNumber.set(this.data.phoneNumber);
this.sendOtp();
   
  }

get otp(): string {
  return this.otpForm.value.otp ?? '';
}

onOtpInput(event: Event): void {

  const input =
    event.target as HTMLInputElement;

  // Keep numbers only
  const value =
    input.value.replace(/\D/g, '').slice(0, 6);

  input.value = value;

  this.otpForm
    .get('otp')
    ?.setValue(value, {
      emitEvent: false
    });
}

 // =========================================================
  // SUCCESS
  // =========================================================
private readonly cartService=inject(CartService);
private readonly dialog=inject(MatDialog)
private readonly orderService=inject(OrderService)
private readonly router=inject(Router)
  private handleSuccessfulOrder(): void {

    this.cartService.clearCart();


    const dialogRef =
      this.dialog.open(
        NotifyMessage,
        {
          width: '400px',

          disableClose: true,

          data: {

            title:
              'ORDER.SUCCESS',

            message:
              'ORDER.SUCCESSORDER'

          }
        }
      );


    dialogRef
      .afterClosed()
      .subscribe(() => {

        this.router.navigate([
          '/products'
        ]);

      });
  }
  verifyOtp(): void {

    if (this.isLoading()) {
      return;
    }

    if (this.otpForm.invalid) {

      this.errorMessage.set(
        'من فضلك ادخل كود التحقق'
      );

      this.focusInput();

      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    const request = {
      phoneNumber: this.phoneNumber(),
      otp: this.otp
    };

    this.otpService.verifyOtp(request)
     
     .subscribe({

        next: response => {

          this.isLoading.set(false);

          if (response.success) {

            this.successMessage.set( 'تم التحقق بنجاح . برجاء الانتظار لاتمام الطلب'
            );

            /*
             * Put your successful action here.
             *
             * For example:
             *
             * this.router.navigate(['/checkout']);
             *
             * or close the dialog.
             */

    this.orderService
      .createOrder(this.data.order)
      .subscribe({

        next: () => {
this.handleSuccessfulOrder();
this.dialogRef.close(true)
        },

        error: error => {
 this.dialogRef.close(false)
        }

      });





            ////
          }

          this.cdr.markForCheck();
        },

        error: error => {

          this.isLoading.set(false);

          const message = 'كود التحقق خطأ او منتهي الصلاحيه.';

          this.errorMessage.set(message);

          if (
            typeof error?.error?.attemptsRemaining === 'number'
          ) {
            this.attemptsRemaining.set(
              error.error.attemptsRemaining
            );
          }

          /*
           * Clear OTP after a failed verification.
           */
          this.clearOtp();

          this.focusInput();

          this.cdr.markForCheck();
        }
      });
  }


  resendOtp(): void {

    if (
      this.isResending() ||
      !this.canResend()
    ) {
      return;
    }

    this.isResending.set(true);
    this.clearMessages();

    const request = {
      phoneNumber: this.phoneNumber()
    };

    this.otpService.sendOtp(request)
     
      .subscribe({

        next: response => {

          this.isResending.set(false);

          this.clearOtp();

          this.attemptsRemaining.set(5);

          this.startTimer();

          this.successMessage.set( 'تم ارسال كود تحقق جديد'
          );

          this.focusInput();

          this.cdr.markForCheck();
        },

        error: error => {

          this.isResending.set(false);

          this.errorMessage.set( 'حدث خطأ لم يتم ارسال ارسال كود التحقق'
          );

          this.cdr.markForCheck();
        }
      });
  }
 sendOtp(): void {

   
    this.isResending.set(true);
    this.clearMessages();

    const request = {
      phoneNumber: this.phoneNumber()
    };

    this.otpService.sendOtp(request)
     
      .subscribe({

        next: response => {

          this.isResending.set(false);

          this.clearOtp();

          this.attemptsRemaining.set(5);

           this.startTimer();

    setTimeout(() => {
      this.focusInput();
    });
 this.cdr.markForCheck();
        },

        error: error => {

          this.isResending.set(false);

          this.errorMessage.set('حدث خطأ لم يتم ارسال كود التحقق'
          );

          this.cdr.markForCheck();
        }
      });
  }

  private startTimer(): void {

    this.stopTimer();

    this.secondsRemaining.set(60);
    this.canResend.set(false);

    this.timer = setInterval(() => {

      const seconds =
        this.secondsRemaining();

      if (seconds <= 1) {

        this.stopTimer();

        this.secondsRemaining.set(0);
        this.canResend.set(true);

      } else {

        this.secondsRemaining.set(
          seconds - 1
        );
      }

      this.cdr.markForCheck();

    }, 1000);
  }


  private stopTimer(): void {

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }


 private clearOtp(): void {

  this.otpForm.reset({
    otp: ''
  });
}


  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }


 

private focusInput(): void {

  const input =
    document.querySelector(
      'input[formControlName="otp"]'
    ) as HTMLInputElement | null;

  input?.focus();
  input?.select();
}


 


  ngOnDestroy(): void {
    this.stopTimer();
  }
}