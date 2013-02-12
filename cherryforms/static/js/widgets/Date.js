define(['underscore', 'backbone', 'core', 'utils', 'moment',
    'widgets/Text', 'datepicker',
    'css!datepicker.css'], function(_, Backbone, CherryForms, Utils, moment) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,

        Field = Fields.Field,
        TextField = Fields.Text,
        TextWidget = Widgets.Text,

        MILLISECOND = 1,
        SECOND = MILLISECOND * 1000,
        MINUTE = SECOND * 60,
        HOUR = MINUTE * 60,
        DAY = HOUR * 24,
        WEEK = DAY * 7,

        DATE_FORMAT = 'yyyy-mm-dd';

    Fields.Date = Field.extend({
        processValue: function () {
            var value = Number(this.get('value')),
                m = this.moment = moment(value);
            this.value = m.format('YYYY-MM-DD');
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
                .datepicker({format: 'yyyy-mm-dd'})
                .on('changeDate', this._onDatePicked);
        },

        _onDatePicked: function (event) {
            this.setValue(moment(event.date).valueOf());
        },

        _onValidate: function () {
            Widget.prototype._onValidate.apply(this, arguments);
            this.getInput().val(this.model.value);
        }
    });

    return CherryForms;
});
