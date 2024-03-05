/**
 * Swaps class between two elements
 * First element has the class added, second has it removed
 * @param {Element | null} firstElement
 * @param {Element | null} secondElement
 * @param {string} className
 */
export function swapClassBetweenTwoElements(
  firstElement: Element | null,
  secondElement: Element | null,
  className: string
) {
  firstElement?.classList.add(className);
  secondElement?.classList.remove(className);
}

/**
 * Gets random color in hex format
 * Uses 16 base for hex and the maximum number for RGB Models
 * @returns random color
 */
export function getRandomColor() {
  const maxNumberRGB = 0xffffff;
  const getRandomColor = `#${Math.floor(Math.random() * maxNumberRGB).toString(16)}`;
  return getRandomColor;
}
