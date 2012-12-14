define(['underscore', 'backbone', 'core'], function(_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Fields = CherryForms.Fields,

        FileField = Fields.File = Fields.Field.extend({
            validate: function (attributes, options) {
                var value = attributes['value'];
                if (value && !(value instanceof File)) {
                    return 'Only File instances accepted';
                }
                return undefined;
            }
        });

    Widgets.File = Widget.extend({
        FieldModel: FileField,
        template: _.template('<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<input type="file" id="{{ input_id }}" class="input-large">' +
        '</div>'),

        _onChange: function () {
            this.model.set('value', this.getInput()[0].files[0]);
        }
    });

    return CherryForms;
});
