export const ESCAPE_KEY = 'Escape'

// The option names of the panel's size, and the union the modal's props take;
// the block's constant test holds them to its tv config.
export const MODAL_SIZE_VARIANTS = ['lg', 'md', 'sm'] as const
export type ModalSizeType = (typeof MODAL_SIZE_VARIANTS)[number]
