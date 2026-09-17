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
    digit1: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit2: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit3: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit4: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit5: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit6: ['', [Validators.required, Validators.pattern('[0-9]')]]
  });


  ngOnInit(): void {

    console.log(this.data.phoneNumber)
    this.phoneNumber.set(this.data.phoneNumber);

    this.startTimer();

    setTimeout(() => {
      this.focusInput(0);
    });
  }


  get otp(): string {
    return [
      this.otpForm.controls.digit1.value,
      this.otpForm.controls.digit2.value,
      this.otpForm.controls.digit3.value,
      this.otpForm.controls.digit4.value,
      this.otpForm.controls.digit5.value,
      this.otpForm.controls.digit6.value
    ].join('');
  }


  onInput(
    event: Event,
    index: number
  ): void {

    const input = event.target as HTMLInputElement;

    let value = input.value;

    /*
     * Keep only numbers.
     */
    value = value.replace(/\D/g, '');

    /*
     * Only one digit per input.
     */
    value = value.charAt(0);

    input.value = value;

    this.setDigit(index, value);

    if (value && index < 5) {
      this.focusInput(index + 1);
    }

    this.clearMessages();

    this.cdr.markForCheck();
  }


  onKeyDown(
    event: KeyboardEvent,
    index: number
  ): void {

    if (
      event.key === 'Backspace' &&
      !this.getDigit(index) &&
      index > 0
    ) {
      event.preventDefault();

      this.setDigit(index - 1, '');

      this.focusInput(index - 1);

      return;
    }

    if (
      event.key === 'ArrowLeft' &&
      index > 0
    ) {
      event.preventDefault();

      this.focusInput(index - 1);

      return;
    }

    if (
      event.key === 'ArrowRight' &&
      index < 5
    ) {
      event.preventDefault();

      this.focusInput(index + 1);
    }
  }


  onPaste(event: ClipboardEvent): void {

    event.preventDefault();

    const pastedText =
      event.clipboardData
        ?.getData('text')
        .replace(/\D/g, '')
        .substring(0, 6);

    if (!pastedText) {
      return;
    }

    const digits = pastedText.split('');

    const controls = [
      this.otpForm.controls.digit1,
      this.otpForm.controls.digit2,
      this.otpForm.controls.digit3,
      this.otpForm.controls.digit4,
      this.otpForm.controls.digit5,
      this.otpForm.controls.digit6
    ];

    controls.forEach((control, index) => {
      control.setValue(digits[index] ?? '');
    });

    if (digits.length < 6) {
      this.focusInput(digits.length);
    } else {
      this.focusInput(5);
    }

    this.clearMessages();

    this.cdr.markForCheck();
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
        'Please enter the complete verification code.'
      );

      this.focusFirstEmptyInput();

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

            this.successMessage.set(
              response.message ||
              'OTP verified successfully.'
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

          const message =
            error?.error?.message ||
            'Invalid or expired verification code.';

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

          this.focusInput(0);

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

          this.successMessage.set(
            response.message ||
            'A new verification code has been sent.'
          );

          this.focusInput(0);

          this.cdr.markForCheck();
        },

        error: error => {

          this.isResending.set(false);

          this.errorMessage.set(
            error?.error?.message ||
            'Unable to send a new verification code.'
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
      digit1: '',
      digit2: '',
      digit3: '',
      digit4: '',
      digit5: '',
      digit6: ''
    });
  }


  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }


  private getDigit(index: number): string {

    const controls = [
      this.otpForm.controls.digit1,
      this.otpForm.controls.digit2,
      this.otpForm.controls.digit3,
      this.otpForm.controls.digit4,
      this.otpForm.controls.digit5,
      this.otpForm.controls.digit6
    ];

    return controls[index].value ?? '';
  }


  private setDigit(
    index: number,
    value: string
  ): void {

    const controls = [
      this.otpForm.controls.digit1,
      this.otpForm.controls.digit2,
      this.otpForm.controls.digit3,
      this.otpForm.controls.digit4,
      this.otpForm.controls.digit5,
      this.otpForm.controls.digit6
    ];

    controls[index].setValue(value);
  }


  private focusInput(index: number): void {

    const input =
      document.querySelector(
        `input[data-otp-index="${index}"]`
      ) as HTMLInputElement | null;

    input?.focus();
    input?.select();
  }


  private focusFirstEmptyInput(): void {

    for (let i = 0; i < 6; i++) {

      if (!this.getDigit(i)) {
        this.focusInput(i);
        return;
      }
    }
  }


  ngOnDestroy(): void {
    this.stopTimer();
  }
}