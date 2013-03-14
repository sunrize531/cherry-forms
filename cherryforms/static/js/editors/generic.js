require(['core'], function (CherryForms) {
    "use strict";
    $('.chf-form').each(function(n, el) {
        (new CherryForms.Form({el: el})).render();
    });
});