define({
    version: '0.1',
    load: function(name, req, onLoad, config) {
        "use strict";
        req(['text!' + name, 'lessjs'], function (lessContent, less) {
            var styleElem,
                parser = new less.Parser({
                    filename: name,
                    paths: [name.split('/').slice(0,-1).join('/') + '/']
                });

            parser.parse(lessContent, function (err, css) {
                if (err) {
                    console.error(err);
                } else {
                    styleElem = document.createElement('style');
                    styleElem.type = 'text/css';

                    if (styleElem.styleSheet) {
                        styleElem.styleSheet.cssText = css.toCSS();
                    } else {
                        styleElem.appendChild( document.createTextNode(css.toCSS()));
                    }
                    document.getElementsByTagName("head")[0].appendChild(styleElem);
                }
                onLoad(styleElem);
            });
        });
    }
});