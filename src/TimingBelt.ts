import { AnimationTimer, TimeoutTimer, elapsed } from "parsegraph-timing";

import log, { logEnterc, logLeave } from "parsegraph-log";

import Method from "parsegraph-method";

import Renderable from "./Renderable";

// Whether idle loops are limited to being called only as
// often as parsegraph_INTERVAL.
export const GOVERNOR = true;

// Where the idle loop is called multiple times per frame if time remains.
export const BURST_IDLE = false;

// How long painting is done, and optionally, how fast idle loops will render.
export const INTERVAL = 15;

// Amount of time, in milliseconds, reserved for idling.
export const IDLE_MARGIN = 1;

export default class TimingBelt {
  _renderables: Renderable[];

  _burstIdle: boolean;
  _lastIdle: Date;
  _idleJobs: Method[];
  _renderTimer: AnimationTimer;
  _governor: boolean;
  _interval: number;
  _idleTimer: TimeoutTimer;
  _lastRender: Date;

  constructor() {
    this._renderables = [];

    this._idleJobs = [];
    this._renderTimer = new AnimationTimer();
    this._renderTimer.setListener(this.cycle, this);

    this._governor = GOVERNOR;
    this._burstIdle = BURST_IDLE;
    this._lastIdle = null;
    this._interval = INTERVAL;
    this._idleTimer = new TimeoutTimer();
    this._idleTimer.setDelay(INTERVAL);
    this._idleTimer.setListener(this.onIdleTimer, this);
    this._idleTimer.schedule();

    this._lastRender = null;
  }

  onIdleTimer() {
    this.idle(INTERVAL - IDLE_MARGIN);
  }

  addRenderable(renderable: Renderable) {
    this._renderables.push(renderable);
    renderable.setOnScheduleUpdate(this.scheduleUpdate, this);
    this.scheduleUpdate();
  }

  removeRenderable(renderable: Renderable) {
    for (let i = 0; i < this._renderables.length; ++i) {
      if (this._renderables[i] === renderable) {
        this._renderables.splice(i, 1);
        renderable.setOnScheduleUpdate(null, null);
        return true;
      }
    }
    return false;
  }

  /**
   * Sets whether idle loops are limited to being called only as
   * often as the configured interval.
   *
   * @param {boolean} governor if true, idle function invocations are throttled to the interval
   */
  setGovernor(governor: boolean): void {
    this._governor = governor;
  }

  /**
   * Whether the idle loop is called multiple times per frame if time remains.
   *
   * @param {boolean} burstIdle if true, the idle loop can be called multiple times per frame
   */
  setBurstIdle(burstIdle: boolean): void {
    this._burstIdle = burstIdle;
  }

  /**
   * How long painting is done, and optionally, how fast idle loops will render.
   *
   * @param {number} interval number of milliseconds to run a single cycle.
   */
  setInterval(interval: number): void {
    this._interval = interval;
  }

  queueJob(jobFunc: Function, jobFuncThisArg?: any): void {
    this._idleJobs.push(new Method(jobFunc, jobFuncThisArg));
    this.scheduleUpdate();
  }

  idle(interval: number): void {
    if (this._idleJobs.length === 0) {
      return;
    }
    const startTime = new Date();
    if (
      interval > 0 &&
      elapsed(startTime) < interval &&
      (!this._governor || !this._lastIdle || elapsed(this._lastIdle) > interval)
    ) {
      do {
        logEnterc("Idle looping", "Idling");
        const job = this._idleJobs[0];
        let r;
        try {
          r = job.call(interval - elapsed(startTime));
        } catch (ex) {
          this._idleJobs.shift();
          this.scheduleUpdate();
          log("Idle threw: ", ex);
          logLeave();
          throw ex;
        }
        if (r !== true) {
          log("Idle job complete");
          this._idleJobs.shift();
        } else {
          log("Idle job not yet complete");
          this.scheduleUpdate();
        }
        logLeave();
      } while (
        this._burstIdle &&
        interval - elapsed(startTime) > 0 &&
        this._idleJobs.length > 0
      );
      if (this._idleJobs.length > 0 && this._governor) {
        this._lastIdle = new Date();
      }
    } else if (this._idleJobs.length > 0) {
      if (elapsed(startTime) >= interval) {
        log(
          "Idle suppressed because there is no" +
            " remaining time in the render loop."
        );
      } else if (
        this._governor &&
        this._lastIdle &&
        elapsed(this._lastIdle) > interval
      ) {
        log("Idle suppressed because the last idle was too recent.");
      }
    }
  }

  runTicks(startTime: Date) {
    let inputChangedScene = false;
    let renderable;
    for (let i = 0; i < this._renderables.length; ++i) {
      renderable = this._renderables[i];
      inputChangedScene =
        renderable.tick(startTime.getTime()) || inputChangedScene;
      log("Running timing belt. inputchangedscene=", inputChangedScene);
    }
    return inputChangedScene;
  }

  cycle() {
    const startTime = new Date();

    // Update all input functions.
    const inputChangedScene = this.runTicks(startTime);

    const interval = this._interval;
    const renderableInterval = Math.max(
      0,
      (interval - elapsed(startTime)) / this._renderables.length
    );
    let needsUpdate = false;
    const renderableOffset = Math.floor(
      Math.random() % this._renderables.length
    );
    let renderable;
    if (inputChangedScene) {
      // console.log("Render and paint");
      for (let i = 0; i < this._renderables.length; ++i) {
        renderable = this._renderables[
          (renderableOffset + i) % this._renderables.length
        ];
        if (i === 0) {
          log("Render and paint");
        }
        needsUpdate = renderable.render() || needsUpdate;
        if (elapsed(startTime) > interval) {
          log("Timeout");
          needsUpdate = true;
          break;
        }
        needsUpdate = renderable.paint(renderableInterval) || needsUpdate;
        log("NeedsUpdate=" + needsUpdate);
      }
    } else {
      for (let i = 0; i < this._renderables.length; ++i) {
        renderable = this._renderables[
          (renderableOffset + i) % this._renderables.length
        ];
        if (i === 0) {
          log("Paint and render");
        }
        if (elapsed(startTime) > interval) {
          log("Timeout");
          needsUpdate = true;
          break;
        }
        needsUpdate = renderable.paint(renderableInterval) || needsUpdate;
        if (elapsed(startTime) > interval) {
          log("Timeout");
          needsUpdate = true;
          break;
        }
        needsUpdate = renderable.render() || needsUpdate;
        log("NeedsUpdate=" + needsUpdate);
      }
    }

    // Run the idle function if possible.
    if (this._idleJobs.length > 0 && !needsUpdate) {
      this._idleTimer.schedule();
    } else if (renderable) {
      log("Can't idle:", this._idleJobs.length, ",", needsUpdate);
    }

    // Determine whether an additional cycle should automatically be scheduled.
    if (needsUpdate || inputChangedScene) {
      this.scheduleUpdate();
    }
    this._lastRender = new Date();
    if (renderable) {
      log("Done rendering in ", elapsed(startTime, this._lastRender), "ms");
    }
  }

  scheduleUpdate(): void {
    log("TimingBelt is scheduling update");
    this._renderTimer.schedule();
  }
}
