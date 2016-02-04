CH=google-chrome
CH_FLAGS=--disable-gpu
PL=plugin

.PHONY: test prepare

all: $(PL).crx

test:
	mocha $(PL)/test

prepare: $(PL).crx
	cp *.crx /tmp

$(PL).crx:
	$(CH) $(CH_FLGS) --pack-extension=$(PL)/src
	mv $(PL)/src.crx $(PL).crx
	mv $(PL)/src.pem $(PL).pem

clean:
	rm -f *.crx *.pem
