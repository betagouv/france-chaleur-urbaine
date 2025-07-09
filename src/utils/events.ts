/**
 * Stop event propagation (useful to avoid event bubbling)
 * @param event - The event to stop propagation of
 */
export const stopPropagation = (event: React.MouseEvent<HTMLDivElement>) => {
  event.stopPropagation();
};
