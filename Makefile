DIST_NAME = timingbelt

SCRIPT_FILES = \
	src/TimingBelt.ts \
	src/index.ts \
	src/log.ts \
	src/Renderable.ts \
	src/JobBelt.ts \
	src/RenderBelt.ts \
	src/AbstractBelt.ts \
	src/demo.ts \
	test/test.ts

EXTRA_SCRIPTS =

include ./Makefile.microproject
