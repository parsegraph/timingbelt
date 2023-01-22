import { AnimationTimer, TimeoutTimer } from "parsegraph-timing";
import { logc } from "./log";

import Renderable from "./Renderable";
import RenderBelt from "./RenderBelt";
import JobBelt from "./JobBelt";

// How long painting is done, and optionally, how fast idle loops will render.
export const INTERVAL = 15;

export default class TimingBelt {
  _renderBelt: RenderBelt;
  _renderTimer: AnimationTimer;

  _idleBelt: JobBelt;
  _idleTimer: TimeoutTimer;

  _lastCycle: number;
  _maxCyclesPerSecond: number;
  _autorender: boolean;

  constructor(interval: number = INTERVAL) {
    this._renderBelt = new RenderBelt(interval);
    this._renderBelt.setOnScheduleUpdate(this.scheduleUpdate, this);
    this._renderTimer = new AnimationTimer();
    this._renderTimer.setListener(this.cycle, this);

    this._idleBelt = new JobBelt(interval);
    this._idleBelt.setOnScheduleUpdate(this.scheduleUpdate, this);
    this._idleTimer = new TimeoutTimer();
    this._idleTimer.setListener(this.idle, this);

    this._lastCycle = NaN;
    this._maxCyclesPerSecond = 0;

    this._autorender = false;
  }

  autorender() {
    return this._autorender;
  }

  setAutorender(autorender: boolean) {
    this._autorender = autorender;
    if (this.autorender()) {
      this.scheduleUpdate();
    }
  }

  setMaxCyclesPerSecond(maxCyclesPerSecond: number) {
    this._maxCyclesPerSecond = maxCyclesPerSecond;
  }

  maxCyclesPerSecond() {
    return this._maxCyclesPerSecond;
  }

  addRenderable(renderable: Renderable) {
    this.renderBelt().addRenderable(renderable);
  }

  removeRenderable(renderable: Renderable) {
    this.renderBelt().removeRenderable(renderable);
  }

  queueJob(jobFunc: Function, jobFuncThisArg?: any) {
    return this.idleBelt().queueJob(jobFunc, jobFuncThisArg);
  }

  setBurstIdle(burstIdle: boolean) {
    this.idleBelt().setBurst(burstIdle);
  }

  setGovernor(governor: boolean) {
    this.idleBelt().setGovernor(governor);
  }

  renderBelt() {
    return this._renderBelt;
  }

  idleBelt() {
    return this._idleBelt;
  }

  idle() {
    this._idleBelt.cycle();
  }

  cycle() {
    // Rate-limit cycling as necessary
    if (!isNaN(this._lastCycle) && this.maxCyclesPerSecond() > 0) {
      const minInterval = 1000 / this.maxCyclesPerSecond();
      if (Date.now() - this._lastCycle < minInterval) {
        logc(
          `TimingBelt is rate-limiting its framrate (${
            minInterval - (Date.now() - this._lastCycle)
          }ms too early)`
        );
        this.scheduleUpdate();
        return;
      }
    }
    this._lastCycle = Date.now();

    if (this._renderBelt.cycle() || this.autorender()) {
      // This belt needs another render (or is autorendering)
      this.scheduleUpdate();
      return;
    }

    // Run the idle function if possible.
    if (this.hasIdleJobs()) {
      this.scheduleIdle();
    }
  }

  hasIdleJobs() {
    return this._idleBelt.hasJobs();
  }

  scheduleIdle() {
    this._idleTimer.schedule();
  }

  scheduleUpdate(): void {
    logc("Schedule updates", "TimingBelt is scheduling update");
    this._renderTimer.schedule();
  }
}
