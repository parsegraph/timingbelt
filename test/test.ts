var assert = require("assert");
import TimingBelt from "../src/TimingBelt.ts";

describe("Package", function () {
  it("works", () => {
    assert.ok(new TimingBelt());
  });
});
