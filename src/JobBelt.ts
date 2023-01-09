import AbstractBelt from "./AbstractBelt";
import Method from "parsegraph-method";
import { elapsed } from "parsegraph-timing";
import { log, logEnterc, logLeave } from "./log";

// Whether idle loops are limited to being called only as
// often as parsegraph_INTERVAL.
export const GOVERNOR = true;

// Where the idle loop is called multiple times per frame if time remains.
export const BURST_IDLE = false;

export default class JobBelt extends AbstractBelt {
  _burst: boolean;
  _governor: boolean;
  _jobs: Method[];

  constructor(interval: number) {
    super(interval);
    this._burst = BURST_IDLE;
    this._governor = GOVERNOR;
    this._jobs = [];
  }

  /**
   * Sets whether loops are limited to being called only as
   * often as the configured interval.
   *
   * @param {boolean} governor if true, idle function invocations are throttled to the interval
   */
  setGovernor(governor: boolean): void {
    this._governor = governor;
  }

  /**
   * Sets whether a job can be called multiple times per cycle
   *
   * @param {boolean} burst if true, the a job can be called multiple times per cycle
   */
  setBurst(burst: boolean): void {
    this._burst = burst;
  }

  setInterval(interval: number) {
    this._interval = interval;
  }

  queueJob(jobFunc: Function, jobFuncThisArg?: any): () => void {
    const m = new Method(jobFunc, jobFuncThisArg);
    this._jobs.push(m);
    this.scheduleUpdate();
    return () => {
      this._jobs = this._jobs.filter((job) => job !== m);
    };
  }

  isThrottled() {
    return (
      this._governor &&
      this._lastCycleStart &&
      elapsed(this._lastCycleStart) < this.interval()
    );
  }

  cycle(): boolean {
    if (!this.hasJobs()) {
      return false;
    }

    this._cycleStart = new Date();
    if (this.isThrottled()) {
      log("Cycle suppressed because the last cycle was too recent.");
      return true;
    }

    do {
      logEnterc("Belts", "Running one job belt cycle");
      const job = this._jobs[0];
      let r;
      try {
        r = job.call(this.currentInterval());
      } catch (ex) {
        this._jobs.shift();
        this.scheduleUpdate();
        log("Idle threw: ", ex);
        logLeave();
        throw ex;
      }
      if (r !== true) {
        log("Idle job complete");
        this._jobs.shift();
      } else {
        log("Idle job not yet complete");
        this.scheduleUpdate();
      }
      logLeave();
    } while (this._burst && !this.hasElapsed() && this.hasJobs());
    this._lastCycleStart = this._cycleStart;

    return this.hasJobs();
  }

  hasJobs() {
    return this._jobs.length > 0;
  }
}
