define(['underscore', 'backbone', 'core', 'utils'], function(_, Backbone, CherryForms, Utils) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Models = CherryForms.Models,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Widget = Widgets.Widget,
        Templates = CherryForms.Templates,
        Patterns = CherryForms.Patterns,
        Events = CherryForms.Events,
        Unset = Utils.Unset,

        IDENTIFIER_PATTERN = Patterns.IDENTIFIER_PATTERN = /^[\w_][\w\d_\-]*$/i,

        TextField, NumberField,
        TextWidget;

    Templates.Text = _.template(
        '<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<input type="text" id="{{ input_id }}" value="{{ value }}" class="input-block-level">' +
        '</div>');
    Templates.TimeDelta = _.template(
        '<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<input type="text" id="{{ input_id }}" value="{{ value }}" class="input-block-level">' +
            '<span class="help-block">Example: 1d 20h 20m 10s 110ms</span>' +
        '</div>');
    Templates.TextArea = _.template(
        '<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<div class="well well-small {{ preview_class }}">{{ value }}</div>' +
            '<div class="{{ textarea_class }}">' +
                '<textarea rows="5" cols="80" id="{{ input_id }}" class="input-block-level">{{ value }}</textarea>' +
            '</div>' +
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

    Fields.Identifier = TextField.extend({
        pattern: IDENTIFIER_PATTERN
    });

    Widgets.Identifier = TextWidget.extend({
        FieldModel: Fields.Identifier
    });

    NumberField = Fields.Number = Field.extend({
        processValue: function () {
            this.value = Number(this.get('value'));
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
        FieldModel: Fields.Number
    });


    Fields.TextArea = TextField.extend({
        defaults: function () {
            return _.extend({}, TextField.prototype.defaults.call(this), {
                'field_class': 'chf-field-textarea',
                'preview_class': 'chf-field-preview',
                'textarea_class': 'chf-field-editor'
            });
        }
    });

    Widgets.TextArea = Widget.extend({
        FieldModel: Fields.TextArea,
        template: 'TextArea',

        events: function () {
            var events = Widget.prototype.events.call(this);
            events['click .' + this.model.get('preview_class')] = 'edit';
            events['blur textarea'] = 'view';
            return events;
        },

        render: function () {
            Widget.prototype.render.call(this);
            this.getTextArea().hide();
        },

        getView: function () {
            if (_.isUndefined(this._view)) {
                this._view = this.$('.' + this.model.get('preview_class'));
            }
            return this._view;
        },

        getTextArea: function () {
            if (_.isUndefined(this._textarea)) {
                this._textarea = this.$('.' + this.model.get('textarea_class'));
            }
            return this._textarea;
        },

        edit: function () {
            this.getView().hide();
            this.getTextArea().show();
            this.getInput().focus();
        },

        view: function () {
            this.getTextArea().hide();
            this.getView().html(this.model.value).show();
        },

        _onValidate: function() {
            Widget.prototype._onValidate.apply(this, arguments);
            this.getInput().val(this.model.value);
            this.getView().html(this.model.value);
        }
    });
    return CherryForms;
});