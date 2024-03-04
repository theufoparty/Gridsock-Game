/**
 * Swaps class between two elements
 * First element has the class added, second has it removed
 * @param {Element | null} firstElement
 * @param {Element | null} SecondElement
 * @param {string} className
 */
export function swapClassBetweenTwoElements(
  firstElement: Element | null,
  SecondElement: Element | null,
  className: string
) {
  firstElement?.classList.add(className);
  SecondElement?.classList.remove(className);
}
