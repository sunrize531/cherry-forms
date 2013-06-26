define(['underscore', 'backbone', 'core', 'widgets/Text'], function(_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Events = CherryForms.Events,

        TextWidget = Widgets.Text,
        NumberField = Fields.Number = Field.extend({
            processValue: function () {
                this.value = Number(this.get('value'));
                if (_.isNaN(this.value)) {
                    this.value = 0;
                }
                this.trigger(Events.FIELD_CHANGE, this);
            },

            validate: function (attributes, options) {
                var value = attributes['value'],
                    number;
                if (value === '' || _.isUndefined(value)) {
                    return false;
                }
                number = Number(value);
                if (_.isNaN(number)) {
                    return 'Value is not a number and cannot be converted to number';
                }
                return false;
            }
        });

    Widgets.Number = TextWidget.extend({
        FieldModel: NumberField
    });
    return CherryForms;
});