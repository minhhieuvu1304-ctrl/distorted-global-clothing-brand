/**
 * UI components barrel — single import surface for all primitives.
 *
 *   import { Button, Input, EarlyAccessForm } from '@/components/ui';
 *
 * Sections and pages built in subsequent prompts should prefer this
 * over deep imports so refactors stay localized.
 */
export { Button, type ButtonProps } from './Button';
export { Input } from './Input';
export { EarlyAccessForm } from './EarlyAccessForm';
export { Modal, useModalRoute } from './Modal';
export { Drawer } from './Drawer';
export { Lightbox, type LightboxImage } from './Lightbox';
export { FadeIn } from './FadeIn';
export { ImageHover } from './ImageHover';
export { CrossfadeImage } from './CrossfadeImage';
