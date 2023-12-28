SHELL := /bin/bash
BUILD_TAG_CMD := echo `git rev-parse --short HEAD`-`[[ -n $$(git status -s) ]] && echo 'dirty' || echo 'clean'`

BUILD_TAG := $(shell ${BUILD_TAG_CMD})
ARCULATOR_BUILD_TAG := $(shell cd arculator-wasm && ${BUILD_TAG_CMD})
NSPARK_BUILD_TAG := $(shell cd nspark-wasm && ${BUILD_TAG_CMD})
SOFTWARE_BUILD_TAG := $(shell cd arclive-software && ${BUILD_TAG_CMD})

all: build/index.html build/arculator.js build/nspark/nspark.js build/emu build/software/software.json

serve:
	python3 -m http.server -d build

clean:
	cd arculator-wasm && make clean && rm -rf emscripten_out
	rm -rf nspark-wasm/build
	rm -rf build

catalogue: build build/software/software.json

build:
	mkdir -p build

build/index.html: frontend build
	cp -r frontend/* build
	jinja2 -D BUILD_TAG=${BUILD_TAG} -D ARCULATOR_BUILD_TAG=${ARCULATOR_BUILD_TAG} -D NSPARK_BUILD_TAG=${NSPARK_BUILD_TAG} -D SOFTWARE_BUILD_TAG=${SOFTWARE_BUILD_TAG} build/index.template.html > build/index.html
	rm build/index.template.html

build/arculator.js: arculator-wasm/build/wasm/arculator.js build
	cp arculator-wasm/build/wasm/arculator.{js,data,data.js,wasm} build
ifdef DEBUG
	cp arculator-wasm/build/wasm/arculator.wasm.map build
endif

build/nspark/nspark.js: nspark-wasm/emscripten_out/nspark.js build
	mkdir -p build/nspark
	cp nspark-wasm/build/*.{js,wasm} build/nspark
	cp nspark-wasm/emscripten/*.js build/nspark

arculator-wasm/build/wasm/arculator.js:
	cd arculator-wasm && make wasm

nspark-wasm/emscripten_out/nspark.js:
	mkdir -p nspark-wasm/build
	emcmake cmake -S nspark-wasm -B nspark-wasm/build
	emmake cmake --build nspark-wasm/build

build/emu: dlcache/arculator21.tar.gz
	mkdir -p build/emu
	tar xzf dlcache/arculator21.tar.gz -C build/emu/ roms cmos

dlcache/arculator21.tar.gz:
	mkdir -p dlcache
	curl -s https://b-em.bbcmicro.com/arculator/Arculator_V2.1_Linux.tar.gz --output dlcache/arculator21.tar.gz

build/software/software.json:
	arclive-software/toml2json.py arclive-software/catalogue/ build/software/

deploy: all
	s3cmd sync -m application/wasm --exclude '*.txt' build/emu/roms s3://files-archi.medes.live/
	cd build && s3cmd sync --no-mime-magic --guess-mime-type software s3://files-archi.medes.live
	cd build && s3cmd sync --no-mime-magic --guess-mime-type --exclude 'emu/*' --exclude 'software/*' . s3://archi.medes.live
