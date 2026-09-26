/**
 * Money is always transported as a decimal string (e.g. "1500.0000") so it never
 * passes through IEEE-754 floats between the API, database and web client.
 */
export type MoneyString = string;

export type ISODateString = string;

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
