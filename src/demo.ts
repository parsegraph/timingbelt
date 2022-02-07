import TimingBelt from "./TimingBelt";
import Renderable from "./Renderable";

const newBtn = (name: string, cb: () => void, className?: string) => {
  const btn = document.createElement("button");
  btn.innerText = name;
  btn.addEventListener("click", cb);
  btn.className = className;
  return btn;
};

let id = 0;

enum EventType {
  TICK,
  PAINT,
  RENDER,
}

class DummyRenderable implements Renderable {
  _id: number;
  _container: HTMLDivElement;
  _canvas: HTMLCanvasElement;
  _ctx: CanvasRenderingContext2D;

  _needsRepaint: HTMLInputElement;
  _needsTick: HTMLInputElement;
  _needsRender: HTMLInputElement;

  _startingX: number;
  _x: number;

  height() {
    return this._canvas.height;
  }

  width() {
    return this._canvas.width;
  }

  constructor(onRemove: () => void) {
    this._id = ++id;
    this._container = document.createElement("div");
    this._container.className = "renderable";

    this._canvas = document.createElement("canvas");
    this._canvas.width = 600;
    this._canvas.height = 30;
    this._ctx = this._canvas.getContext("2d");
    this._ctx.fillStyle = "black";
    this._ctx.fillRect(0, 0, this.width(), this.height());
    this._container.appendChild(this._canvas);

    this._ctx.textBaseline = "bottom";

    this._ctx.fillStyle = "cyan";

    const textWidth = "Tick Paint Render"
      .split(" ")
      .map((word) => {
        return this._ctx.measureText(word).width;
      })
      .reduce((prev, cur) => {
        return Math.max(prev, cur);
      });

    this._ctx.fillText("Tick", 0, this.height() / 3, this.width());

    this._ctx.fillStyle = "yellow";
    this._ctx.fillText("Paint", 0, (2 * this.height()) / 3, this.width());

    this._ctx.fillStyle = "red";
    this._ctx.fillText("Render", 0, this.height(), this.width());

    this._startingX = textWidth;
    this._x = this._startingX;

    const title = document.createElement("h3");
    title.innerText = "DummyRenderable " + this._id;
    this._container.appendChild(title);

    const btns = document.createElement("div");
    btns.className = "buttons";
    this._container.appendChild(btns);

    btns.appendChild(
      newBtn("Schedule Update", () => {
        this.scheduleUpdate();
      })
    );

    if (onRemove) {
      btns.appendChild(newBtn("Delete Renderable", onRemove, "danger"));
    }

    const makeCheck = (name: string, cb?: (checked: boolean) => void) => {
      const chk = document.createElement("input");
      chk.type = "checkbox";
      if (cb) {
        chk.addEventListener("change", () => {
          cb(chk.checked);
        });
      }
      const label = document.createElement("label");
      label.innerText = name;
      label.appendChild(chk);
      return chk;
    };

    const checks = document.createElement("div");
    checks.className = "buttons";
    this._needsTick = makeCheck("Needs Tick");
    checks.appendChild(this._needsTick.parentElement);
    this._needsRepaint = makeCheck("Needs Repaint");
    checks.appendChild(this._needsRepaint.parentElement);
    this._needsRender = makeCheck("Needs Render");
    checks.appendChild(this._needsRender.parentElement);
    this._container.appendChild(checks);
  }

  drawLine(type: EventType) {
    this._ctx.fillStyle = (() => {
      switch (type) {
        case EventType.TICK:
          return "cyan";
        case EventType.PAINT:
          return "yellow";
        case EventType.RENDER:
          return "red";
      }
    })();
    const index = (() => {
      switch (type) {
        case EventType.TICK:
          return 0;
        case EventType.PAINT:
          return 1;
        case EventType.RENDER:
          return 2;
      }
    })();
    const x = this._x++;
    this._ctx.fillRect(x, (index * this.height()) / 3, 1, this.height() / 3);
    if (this._x > this.width()) {
      this._ctx.fillStyle = "black";
      this._ctx.fillRect(
        this._startingX,
        0,
        this.width() - this._startingX,
        this.height()
      );
      this._x = this._startingX;
    }
  }

  tick(): boolean {
    this.drawLine(EventType.TICK);
    return this._needsTick.checked;
  }

  paint(): boolean {
    this.drawLine(EventType.PAINT);
    return this._needsRepaint.checked;
  }

  render(): boolean {
    this.drawLine(EventType.RENDER);
    return this._needsRender.checked;
  }

  _listener: () => void;
  _listenerObj: object;

  setOnScheduleUpdate(listener: () => void, listenerObj?: object): void {
    this._listener = listener;
    this._listenerObj = listenerObj;
  }

  scheduleUpdate() {
    if (this._listener) {
      this._listener.call(this._listenerObj);
    }
  }

  root() {
    return this._container;
  }

  unmount() {

  }
}

class TimingBeltDemo {
  _container: HTMLDivElement;
  _belt: TimingBelt;
  _id: number;

  constructor(onRemove?: () => void) {
    this._id = id++;
    this._belt = new TimingBelt();

    this._container = document.createElement("div");
    this._container.className = "demo";
    const title = document.createElement("h3");
    title.innerText = "TimingBelt " + this._id;
    this._container.appendChild(title);

    const btns = document.createElement("div");
    btns.className = "buttons";
    this._container.appendChild(btns);

    const renderables = document.createElement("div");
    renderables.className = "renderables";
    this._container.appendChild(renderables);
    btns.appendChild(
      newBtn("New Renderable", () => {
        const renderable = new DummyRenderable(() => {
          renderables.removeChild(renderable.root());
          this._belt.removeRenderable(renderable);
        });
        this._belt.addRenderable(renderable);
        renderables.appendChild(renderable.root());
      })
    );

    if (onRemove) {
      btns.appendChild(newBtn("Delete TimingBelt", onRemove, "danger"));
    }
  }

  root() {
    return this._container;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  const btn = document.createElement("button");
  btn.innerText = "Create TimingBelt";
  root.appendChild(btn);
  btn.addEventListener("click", () => {
    const form = new TimingBeltDemo(() => {
      root.removeChild(form.root());
    });
    root.appendChild(form.root());
  });
});
