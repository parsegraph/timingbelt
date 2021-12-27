var assert = require("assert");
import TimingBelt from "../dist/parsegraph-timingbelt";

describe("Package", function () {
  it("works", () => {
    assert.ok(new TimingBelt());
  });
});
