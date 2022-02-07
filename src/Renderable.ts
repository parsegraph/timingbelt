export default interface Renderable {
  /**
   * Runs the render loop for this element.
   *
   * @returns {boolean} true if this renderable has changed.
   */
  tick(cycleStart: number): boolean;

  /**
   * Paints this element, within the given timeout.
   *
   * @returns {boolean} true if painting is incomplete.
   */
  paint(timeout?: number): boolean;

  /**
   * Renders this element.
   *
   * @returns {boolean} true if rendering is incomplete.
   */
  render(): boolean;

  /**
   * Sets the listener for this renderable, to be notified
   * when the renderable changes.
   */
  setOnScheduleUpdate(listener: () => void, listenerObj?: object): void;
}
