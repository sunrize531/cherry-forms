define(['underscore', 'core'], function (_, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,

        CheckBoxField = Fields.CheckBox = Fields.Field.extend({
            processValue: function () {
                this.value = Boolean(this.get('value'));
                this.trigger(Events.FIELD_CHANGE, this);
            }
        });

    Widgets.CheckBox = Widget.extend({
        template: _.template(
            '<label class="checkbox">' +
            '<input type="checkbox" value="true"{% if (value) { %} checked{% } %}> {{ label }}</label>'),
        FieldModel: CheckBoxField
    });
});