# parsegraph-timingbelt

This module provides a TimingBelt, which manages a render loop using the
requestAnimationFrame API. Time for painting is restricted, such that
Renderables on a timing belt are allotted a given amount and are expected to
return as soon as that interval has elapsed, if painting is not complete.
