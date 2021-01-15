var assert = require("assert");
import todo from "../dist/timingbelt";

describe("Package", function () {
  it("works", ()=>{
    assert.equal(todo(), 42);
  });
});
