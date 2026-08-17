/**
 * Per-request accumulator for validation/handler error messages, exposed on `apiker.responseParams`
 */
export class ResponseParams {
  errors: string[] = [];

  /**
   * Sets an error response
   */
  setError = (errorMessage: string) => {
    this.errors.push(errorMessage);
  }

  /**
   * Gets the last error response
   */
  getLastError = (): string | null => {
    return this.errors.length ?
      [...this.errors].pop() as string
      : null;
  }
}