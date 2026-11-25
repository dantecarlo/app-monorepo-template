/** A pgTAP file read as the Postgres lexer reads it, each view as long as the file. */
export interface IPgTapCode {
  /** Every comment, string, quoted identifier and dollar body blanked to spaces. */
  code: string
  /** Comments and strings blanked, quoted identifiers and dollar bodies kept as written. */
  searchable: string
}
