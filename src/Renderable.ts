export default interface Renderable {
  tick(elapsed: number): boolean;
  paint(timeout?: number): boolean;
  render(): boolean;
  setOnScheduleUpdate(listener: () => void, listenerObj?: object): void;
}
