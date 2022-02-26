var assert = require("assert");
import TimingBelt from "../src/index.ts";

describe("Package", function () {
  it("works", () => {
    assert.ok(new TimingBelt());
  });
});
