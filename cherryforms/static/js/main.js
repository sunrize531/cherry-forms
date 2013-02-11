requirejs.config({
    paths: {
        'jquery': 'libs/jquery-1.8.3.min',
        'lessjs': 'libs/less-1.3.1.min',
        'bootstrap': 'libs/bootstrap.min',
        'underscore': 'libs/underscore-min',
        'backbone': 'libs/backbone-min',
        'handsontable': 'libs/jquery.handsontable',
        'datepicker': 'libs/bootstrap-datepicker',
        'moment': 'libs/moment.min',

        'css': 'libs/require-css',
        'less': 'libs/require-less',
        'text': 'libs/require-text',
        'async': 'libs/require-async',
        'goog': 'libs/require-goog',
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
            deps: ['jquery', 'bootstrap']
        },
        'handsontable': {
            deps: ['jquery'],
            exports: 'Handsontable'
        },
        'moment': {
            exports: 'moment'
        }
    }
});