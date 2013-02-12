define(['underscore', 'backbone', 'core'], function(_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Widget = Widgets.Widget,
        Templates = CherryForms.Templates,
        Events = CherryForms.Events,

        TextField, TextWidget;

    Templates.Text = _.template(
        '<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<input type="text" id="{{ input_id }}" value="{{ value }}" class="{{ input_class }}">' +
        '</div>');

    Templates.TextCompact = _.template(
        '<div class="input-prepend">' +
            '<span class="add-on">{{ label }}</span>' +
            '<input type="text" id="{{ input_id }}" value="{{ value }}" class="{{ input_class }}">' +
        '</div>');


    TextField = Fields.Text = Field.extend({
        processValue: function () {
            var value = this.get('value');
            if (!value) {
                this.unsetValue();
            } else {
                this.value = String(value);
                this.trigger(Events.FIELD_CHANGE, this);
            }
        },

        validate: function (attributes, options) {
            var value = attributes['value'];
            if (!_.isUndefined(this.pattern) && value) {
                return !this.pattern.test(value);
            }
            return false;
        },

        toJSON: function () {
            return _.defaults(Field.prototype.toJSON.call(this), {
                value: ''
            });
        }
    });

    TextWidget = Widgets.Text = Widget.extend({
        FieldModel: TextField,
        template: Templates.Text,

        _onValidate: function() {
            Widget.prototype._onValidate.apply(this, arguments);
            this.getInput().val(this.model.value);
        }
    });

    return CherryForms;
});