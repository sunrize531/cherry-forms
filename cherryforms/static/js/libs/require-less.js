define({
    version: '0.1',
    load: function(name, req, onLoad, config) {
        "use strict";
        var less_path = config.config['less_path'];
        req(['text!' + less_path + name, 'lessjs', 'jquery'], function (lessContent, less, $) {
            var style,
                parser = new less.Parser({
                    filename: name,
                    paths: [less_path]
                });

            parser.parse(lessContent, function (err, css) {
                if (err) {
                    console.error(err);
                } else {
                    style = document.createElement('style');
                    style.type = 'text/css';

                    if (style.styleSheet) {
                        style.styleSheet.cssText = css.toCSS();
                    } else {
                        style.appendChild( document.createTextNode(css.toCSS()));
                    }
                    $('head').append(style);
                }
                onLoad(style);
            });
        });
    }
});