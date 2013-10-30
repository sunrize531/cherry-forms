define(['underscore', 'backbone', 'core', 'utils', 'moment',
    'widgets/Text', 'datepicker'], function(_, Backbone, CherryForms, Utils, moment) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,

        Field = Fields.Field,
        TextWidget = Widgets.Text,

        DATE_FORMAT = 'YYYY-MM-DD';

    Fields.Date = Field.extend({
        processValue: function () {
            var value = Number(this.get('value')),
                m = this.moment = moment(value);
            this.value = m.format(DATE_FORMAT);
            this.trigger(Events.FIELD_CHANGE, this);
            return undefined;
        },

        dumpValue: function () {
            return this.moment.valueOf();
        },

        toJSON: function () {
            var re = Field.prototype.toJSON.call(this);
            re['value'] = this.value;
            return re;
        }
    });

    Widgets.Date = TextWidget.extend({
        render: function () {
            TextWidget.prototype.render.call(this);
            _.bindAll(this, '_onDatePicked');
            this.getInput()
                .datetimepicker({format: DATE_FORMAT, pickTime: false})
                .on('change.dp', this._onDatePicked);
        },

        _onDatePicked: function (event) {
            this.setValue(moment(event.date).valueOf());
            this.getInput().blur();
        },

        _onValidate: function () {
            Widget.prototype._onValidate.apply(this, arguments);
            this.getInput().val(this.model.value);
        }
    });

    return CherryForms;
});
