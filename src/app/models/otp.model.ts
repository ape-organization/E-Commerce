export interface OtpVerificationResponse {
  success: boolean;
  message: string;
  attemptsRemaining: number;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  data?: unknown;
}