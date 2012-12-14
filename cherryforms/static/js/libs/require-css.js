define({
    version: '0.1',
    load: function(name, req, onLoad, config) {
        "use strict";
        req(['text!' + config.config['css_path'] + name, 'jquery'], function (cssContent) {
            var style = document.createElement('style');
            style.type = 'text/css';

            if (style.styleSheet) {
                style.styleSheet.cssText = cssContent;
            } else {
                style.appendChild( document.createTextNode(cssContent));
            }
            $('head').append(style);
            onLoad(style);
        });
    }
});