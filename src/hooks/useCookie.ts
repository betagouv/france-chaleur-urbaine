/**
 * This hook uses @react-hookz/web package for cookie management.
 * It needs dependencies and typescript as it does not work out of the box.
 *
 *
 * To install the required dependencies:
 * ```
 * pnpm add @react-hookz/web js-cookie
 * pnpm add -D @types/js-cookie
 * ```
 *
 * Note: https://react-hookz.github.io/web/?path=/docs/side-effect-usecookievalue--example#importing
 */
import { useCookieValue } from '@react-hookz/web/useCookieValue';

export default useCookieValue;
