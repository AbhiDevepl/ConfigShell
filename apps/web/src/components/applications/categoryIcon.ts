import {
  Brain,
  Code,
  Gamepad2,
  Globe,
  GraduationCap,
  Laptop,
  Server,
  Video,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { Category } from '@configshell/catalog';

/**
 * One icon per catalog category, in one place.
 *
 * Safe, generic placeholders — never a vendor logo. The catalog card, the
 * category filter chips and the selection list all read this map, so an
 * application is recognisable by the same mark wherever it appears and a new
 * category is a one-line change here rather than three.
 */
export const CATEGORY_ICON: Record<Category, ComponentType<{ className?: string }>> = {
  General: Laptop,
  Student: GraduationCap,
  Developer: Code,
  'Web Developer': Globe,
  DevOps: Server,
  'Data & AI': Brain,
  'Content Creator': Video,
  Gaming: Gamepad2,
};
