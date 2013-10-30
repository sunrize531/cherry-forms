(function () {
    "use strict";
    var defaultConfig = {
            paths: {
                'jquery': 'libs/jquery-1.10.2.min',
                'lessjs': 'libs/less-1.3.1.min',
                'bootstrap': 'libs/bootstrap.min',
                'underscore': 'libs/underscore-min',
                'backbone': 'libs/backbone-min',
                'handsontable': 'libs/jquery.handsontable',
                'datepicker': 'libs/bootstrap-datetimepicker.min',
                'moment': 'libs/moment.min',
                'highcharts': 'libs/highcharts',
                'highcharts-exporting': 'libs/highcharts-exporting',

                'css': 'libs/require-css',
                'less': 'libs/require-less',
                'text': 'libs/require-text',
                'async': 'libs/require-async',
                'propertyParser': 'libs/require-property-parser'
            },
            config: {
                'less_path': '/cherryforms/css/',
                'css_path':  '/cherryforms/css/'
            },
            baseUrl: '/cherryforms/js/',
            shim: {
                'bootstrap': ['jquery'],
                'underscore': {
                    exports: '_'
                },
                'backbone': {
                    deps: ['underscore', 'jquery'],
                    exports: 'Backbone'
                },
                'lessjs': {
                    exports: 'less'
                },
                'datepicker': {
                    deps: ['moment', 'jquery', 'bootstrap', 'css!bootstrap-datetimepicker.min.css'],
                    init: function (moment) {
                        window.moment = moment;
                    }
                },
                'handsontable': {
                    deps: ['jquery', 'css!jquery.handsontable.css'],
                    exports: 'Handsontable'
                },
                'highcharts': {
                    exports: 'Highcharts'
                },
                'highcharts-exporting': ['highcharts']
            }
        },
        config = window.CherryFormsConfig;

    function isObject(value) {
        return typeof (value) === 'object';
    }

    function isUndefined(value) {
        return value === undefined;
    }

    function merge (target, source) {
        var result = {},
            prop, sourceValue, targetValue;
        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                sourceValue = source[prop];
                targetValue = target[prop];
                if (isObject(sourceValue) && isObject(targetValue)) {
                    target[prop] = merge(targetValue, sourceValue);
                } else if (!isUndefined(targetValue)){
                    target[prop] = sourceValue;
                }
            }
        }
        return target;
    }

    if (isObject(config)) {
        merge(defaultConfig, config);
    }

    require.config(defaultConfig);
} ());