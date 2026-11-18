import NextImage from 'next/image'
import type { JSX } from 'react'

import type { IImageProps } from '@/components/ui/Image/Image.type'

// An image, drawn by the framework's image component. The framework stays in
// components/ui, so a block renders this one and never imports next/image.
export const Image = ({
  alt,
  className,
  height,
  onError,
  priority,
  src,
  width
}: IImageProps): JSX.Element => (
  <NextImage
    alt={alt}
    className={className}
    height={height}
    onError={onError}
    priority={priority}
    src={src}
    width={width}
  />
)
