export interface ApiValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export interface ApiErrorResponse {
  status: number;
  statusText: string;
  message: string;
  errors?: Record<string, string[]>;
  retryAfter?: number | null;
}
