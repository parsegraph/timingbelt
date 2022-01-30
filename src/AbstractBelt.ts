import Method from "parsegraph-method";
import { elapsed } from "parsegraph-timing";

export default abstract class AbstractBelt {
  _lastCycleStart: Date;
  _cycleStart: Date;
  _interval: number;
  _scheduleUpdate: Method;

  constructor(interval: number) {
    this._scheduleUpdate = new Method();
    this._interval = interval;
    this._cycleStart = null;
    this._lastCycleStart = null;
  }

  interval() {
    return this._interval;
  }

  setOnScheduleUpdate(listener: ()=>void, listenerObj?: object) {
    this._scheduleUpdate.set(listener, listenerObj);
  }

  scheduleUpdate() {
    this._scheduleUpdate.call();
  }

  currentInterval() {
    return this._interval - elapsed(this._cycleStart);
  }

  hasElapsed() {
    return this.currentInterval() <= 0;
  }

  abstract cycle(): boolean;
}

