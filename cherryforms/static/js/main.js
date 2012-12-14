requirejs.config({
    paths: {
        'jquery': '/static/js/jquery-1.7.2.min',
        'lessjs': '/static/js/less-1.3.1.min',
        'bootstrap': '/static/admin/js/bootstrap.min',
        'underscore': '/static/admin/js/underscore',
        'backbone': '/static/admin/js/backbone',
        'handsontable': '/static/admin/js/jquery.handsontable',
        'less': 'require-less',
        'text': 'require-text'
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

require(['underscore', 'backbone', 'core'], function (_, Backbone, CherryForms) {

});
