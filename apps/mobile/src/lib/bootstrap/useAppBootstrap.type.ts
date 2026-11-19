export interface IUseAppBootstrapResult {
  /**
   * True once the fonts have loaded or failed to load, when the splash
   * screen is hidden and the root layout may render its routes.
   */
  isReady: boolean
}
