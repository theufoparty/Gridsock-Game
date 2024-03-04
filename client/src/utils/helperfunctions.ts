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
