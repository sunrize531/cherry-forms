define(['underscore', 'backbone', 'core', 'utils', 'moment',
    'widgets/Text', 'datepicker',
    'css!datepicker.css'], function(_, Backbone, CherryForms, Utils, moment) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,
        Templates = CherryForms.Templates,

        Field = Fields.Field,
        TextField = Fields.Text,
        TextWidget = Widgets.Text,

        MILLISECOND = 1,
        SECOND = MILLISECOND * 1000,
        MINUTE = SECOND * 60,
        HOUR = MINUTE * 60,
        DAY = HOUR * 24,
        WEEK = DAY * 7,

        DATE_FORMAT = 'YYYY-MM-DD HH:mm';

    Fields.Time = Field.extend({
        processValue: function () {
            var value = this.get('value'),
                ms = Number(value),
                m;
            console.log(value, ms);
            if (ms instanceof Number) {
                m = moment(ms);
            } else if (_.isString(value)) {
                m = moment(value, DATE_FORMAT);
            } else {
                m = moment();
            }

            this.value = m.format(DATE_FORMAT);
            this.moment = m;
            this.trigger(Events.FIELD_CHANGE, this);
            return undefined;
        },

        dumpValue: function () {
            return this.moment.valueOf();
        },

        toJSON: function () {
            var re = Field.prototype.toJSON.call(this);
            re['value'] = this.value;
            re['now'] = moment().format(DATE_FORMAT);
            return re;
        }
    });

    Templates.Time = _.template(
        '<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<input type="text" id="{{ input_id }}" value="{{ value }}" class="{{ input_class }}">' +
            '<span class="help-block">Date format: ' + DATE_FORMAT + '</span>' +
        '</div>');


    Widgets.Time = TextWidget.extend({
        FieldModel: Fields.Time,
        template: Templates.Time,

        _onValidate: function () {
            Widget.prototype._onValidate.apply(this, arguments);
            this.getInput().val(this.model.value);
        }
    });

    return CherryForms;
});
