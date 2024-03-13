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
  const maximumR = 0xcc;
  const maximumG = 0xcc;
  const maximumB = 0xcc;

  const r = Math.floor(Math.random() * maximumR);
  const g = Math.floor(Math.random() * maximumG);
  const b = Math.floor(Math.random() * maximumB);

  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`;
}

export function addFirstClassAndRemoveSecondClassToElement(
  element: Element | null,
  firstClassName: string,
  secondClassName: string
) {
  element?.classList.add(firstClassName);
  element?.classList.remove(secondClassName);
}

export function removeAndAddNewClassOnTwoElements(
  elementOne: Element | null,
  elementTwo: Element | null,
  classNameOne: string,
  classNameTwo: string
) {
  elementOne?.classList.add(classNameOne);
  elementOne?.classList.remove(classNameTwo);
  elementTwo?.classList.add(classNameTwo);
  elementTwo?.classList.remove(classNameOne);
}

export function displayOrHideTwoElements(elementOne: Element | null, elementTwo: Element | null, state: boolean) {
  if (state) {
    elementOne?.classList.remove('hidden');
    elementTwo?.classList.remove('hidden');
  } else {
    elementOne?.classList.add('hidden');
    elementTwo?.classList.add('hidden');
  }
}
