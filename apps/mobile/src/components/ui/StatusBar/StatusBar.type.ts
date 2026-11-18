/** The status bar's glyphs: dark over a light theme, light over a dark one. */
export type StatusBarStyleType = 'dark' | 'light'

export interface IStatusBarProps {
  style: StatusBarStyleType
}
