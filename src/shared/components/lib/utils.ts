import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine plusieurs classes Tailwind en gérant les conflits et la logique conditionnelle
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}