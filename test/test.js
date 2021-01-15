var assert = require("assert");
import TimingBelt from "../dist/timingbelt";

describe("Package", function () {
  it("works", ()=>{
    assert.ok(new TimingBelt());
  });
});
