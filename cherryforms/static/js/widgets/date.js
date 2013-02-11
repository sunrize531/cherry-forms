define(['underscore', 'backbone', 'core', 'utils', 'moment',
    'widgets/text', 'datepicker',
    'css!datepicker.css'], function(_, Backbone, CherryForms, Utils, moment) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Fields = CherryForms.Fields,
        Events = CherryForms.Events,
        Templates = CherryForms.Templates,
        Unset = Utils.Unset,

        Field = Fields.Field,
        TextField = Fields.Text,
        NumberField = Fields.Number,
        TextWidget = Widgets.Text,

        MILLISECOND = 1,
        SECOND = MILLISECOND * 1000,
        MINUTE = SECOND * 60,
        HOUR = MINUTE * 60,
        DAY = HOUR * 24,
        WEEK = DAY * 7,

        DATE_FORMAT = 'yyyy-mm-dd';

    Templates.TimeDelta = _.template(
        '<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<input type="text" id="{{ input_id }}" value="{{ value }}" class="{{ input_class }}">' +
            '<span class="help-block">Example: 1d 20h 20m 10s 110ms</span>' +
        '</div>');

    Fields.TimeDelta = Field.extend({
        pattern: /^((\d+)w\s*)?((\d+)d\s*)?((\d+)h\s*)?((\d+)m\s*)?((\d+)s\s*)?((\d+)ms\s*)?$/i,
        periods: [[DAY, 'd'], [HOUR, 'h'], [MINUTE, 'm'], [SECOND, 's'], [MILLISECOND, 'ms']],

        defaults: function () {
            return TextField.prototype.defaults.call();
        },

        validate: function (attributes, options) {
            var value = attributes['value'];
            if (this.pattern.test(value)) {
                return false;
            }
            return NumberField.prototype.validate.call(this, attributes, options);
        },

        processValue: function () {
            var value = this.get('value'),
                delta = this.getDelta(value),
                stamp = this.getStamp(value);

            if (!_.isUndefined(delta)) {
                this.value = value;
                this.delta = delta;
            } else if (_.isNumber(stamp)) {
                this.value = stamp;
                this.delta = value;
            } else {
                this.unsetValue();
                return undefined;
            }
            this.trigger(Events.FIELD_CHANGE, this);
            return undefined;
        },

        unsetValue: function () {
            this.value = new Unset();
            this.delta = '';
            this.trigger(Events.FIELD_CLEAR, this);
        },

        dumpValue: function () {
            return this.value;
        },

        toJSON: function () {
            var re = TextField.prototype.toJSON.call(this);
            re['value'] = this.delta;
            return re;
        },

        getDelta: function (stamp) {
            var delta = [];
            stamp = Number(stamp);
            if (!_.isNaN(stamp)) {
                _.each(this.periods, function (p) {
                    var period = p[0],
                        q = Math.floor(stamp / period);
                    if (q) {
                        delta.push(q + p[1]);
                        stamp = stamp % period;
                    }
                });
                return delta.join(' ');
            }
            return undefined;
        },

        getStamp: function (delta) {
            var stamp,
                match = this.pattern.exec(delta);
            if (!_.isNull(match)) {
                stamp = 0;
                _.each(this.periods, function (p, i) {
                    var t = Number(match[(i + 2) * 2]);
                    if (!_.isNaN(t)) {
                        stamp += t * Number(p[0]);
                    }
                });
                return stamp;
            }
            return undefined;
        }
    });

    Widgets.TimeDelta = TextWidget.extend({
        FieldModel: Fields.TimeDelta,
        template: 'TimeDelta',

        _onValidate: function() {
            Widget.prototype._onValidate.apply(this, arguments);
            this.getInput().val(this.model.delta);
        }
    });

    Fields.Date = Field.extend({
        defaults: function () {
            return TextField.prototype.defaults.call(this);
        },

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
            var datepicker = this.getInput()
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
