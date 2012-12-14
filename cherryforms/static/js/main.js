requirejs.config({
    paths: {
        'jquery': 'libs/jquery-1.7.2.min',
        'lessjs': 'libs/less-1.3.1.min',
        'bootstrap': 'libs/bootstrap.min',
        'underscore': 'libs/underscore-min',
        'backbone': 'libs/backbone-min',
        'handsontable': 'libs/jquery.handsontable',
        'css': 'libs/require-css',
        'less': 'libs/require-less',
        'text': 'libs/require-text'
    },
    baseUrl: '/static/admin/js/cherry-forms',
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
        'handsontable': {
            deps: ['jquery'],
            exports: 'Handsontable'
        }
    }
});