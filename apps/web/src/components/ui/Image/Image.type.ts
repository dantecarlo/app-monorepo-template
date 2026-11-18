export interface IImageProps {
  /** What the image shows, read by assistive technology. */
  alt: string
  className?: string
  height: number
  onError?: () => void
  /** Loads the image eagerly, for an image the first paint shows. */
  priority?: boolean
  src: string
  width: number
}
