import { AnimationTimer, TimeoutTimer } from "parsegraph-timing";
import { logc } from "parsegraph-log";

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

  constructor(interval: number = INTERVAL) {
    this._renderBelt = new RenderBelt(interval);
    this._renderBelt.setOnScheduleUpdate(this.scheduleUpdate, this);
    this._renderTimer = new AnimationTimer();
    this._renderTimer.setListener(this.cycle, this);

    this._idleBelt = new JobBelt(interval);
    this._idleBelt.setOnScheduleUpdate(this.scheduleUpdate, this);
    this._idleTimer = new TimeoutTimer();
    this._idleTimer.setListener(this.idle, this);
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
    if (this._renderBelt.cycle()) {
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
