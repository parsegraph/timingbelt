import { elapsed } from "parsegraph-timing";
import log, { logEnterc, logLeave } from "parsegraph-log";

import AbstractBelt from "./AbstractBelt";
import Renderable from "./Renderable";

export default class RenderBelt extends AbstractBelt {
  _renderables: Renderable[];

  constructor(interval: number) {
    super(interval);
    this._renderables = [];
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
        this.scheduleUpdate();
        renderable.unmount();
        return true;
      }
    }
    return false;
  }

  iterate() {
    const renderableOffset = Math.floor(
      Math.random() % this._renderables.length
    );
    let i = 0;
    return () => {
      if (i >= this._renderables.length) {
        return null;
      }
      return this._renderables[
        (renderableOffset + i++) % this._renderables.length
      ];
    };
  }

  paintAndRender() {
    logEnterc("Painting & Rendering", "Paint and render");
    let needsUpdate = false;
    let renderable: Renderable;
    const iter = this.iterate();
    while ((renderable = iter())) {
      if (this.hasElapsed()) {
        logLeave();
        return true;
      }
      needsUpdate = renderable.paint(this.renderableInterval()) || needsUpdate;
      if (this.hasElapsed()) {
        log("Painting ran out of time.");
        logLeave();
        return true;
      }
      needsUpdate = renderable.render() || needsUpdate;
      if (needsUpdate) {
        log("Painting needs another cycle.");
      }
    }
    logLeave();
    return needsUpdate;
  }

  renderAndPaint() {
    logEnterc("Painting & Rendering", "Render and paint");
    let needsUpdate = false;
    let renderable: Renderable;
    const iter = this.iterate();
    while ((renderable = iter())) {
      needsUpdate = renderable.render() || needsUpdate;
      if (this.hasElapsed()) {
        log("Rendering ran out of time.");
        logLeave();
        return true;
      }
      needsUpdate = renderable.paint(this.renderableInterval()) || needsUpdate;
      if (needsUpdate) {
        log("Painting needs another cycle.");
      }
    }
    logLeave();
    return needsUpdate;
  }

  renderableInterval() {
    return Math.max(
      0,
      (this.interval() - elapsed(this._cycleStart)) / this._renderables.length
    );
  }

  runTicks() {
    let inputChangedScene = false;
    let renderable;
    for (let i = 0; i < this._renderables.length; ++i) {
      renderable = this._renderables[i];
      inputChangedScene =
        renderable.tick(this._cycleStart.getTime()) || inputChangedScene;
    }
    return inputChangedScene;
  }

  cycle() {
    this._lastCycleStart = this._cycleStart;
    this._cycleStart = new Date();

    // Update all input functions.
    return this.runTicks() ? this.renderAndPaint() || true : this.paintAndRender();
  }
}
