define(['underscore', 'backbone', 'core', 'widgets/Select',
    'less!chf-buttons-group.less'], function (_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        SelectField = Fields.Select,

        RadioGroupField = Fields.RadioGroup = SelectField.extend({
            defaults: function () {
                return _.extend(SelectField.prototype.defaults.call(this), {
                    'not_null': true,
                    'label_class': 'chf-field-label',
                    'group_class': 'chf-buttons-group',
                    'button_class': 'chf-button'
                });
            }
        }),

        RadioGroupWidget = Widgets.RadioGroup = Widgets.Select.extend({
            className: 'chf-field-buttons-group',
            FieldModel: RadioGroupField,
            template: _.template('<label>{{ label }}</label>' +
                '<div id="{{ input_id }}" class="btn-group {{ group_class }}" data-toggle="buttons-radio"></div>'),
            optionsTemplate: _.template(
                '<button type="button" ' +
                    'class="btn btn-small {{ button_class }}{% if (selected) { %} active{% } %}" ' +
                    'data-value="{{ value }}">' +
                '{{ title }}</button>'),

            $getOption: function (option) {
                return this.getInput().find(
                    '.' + this.model.get('button_class') + '[data-value="' + option.get('value') + '"]');
            },

            events: function () {
                var events = {};
                events['click .' + this.model.get('button_class')] = '_onOptionClick';
                return events;
            },

            updateOption: function (option) {
                var selected = Boolean(option.get('selected')),
                    $li = this.$getOption(option).parent('li');
                this.$('.' + this.model.get('button_class')).removeClass('active');
                if (selected) {
                    $li.addClass('active');
                }
            },

            _onOptionClick: function (event) {
                var $option = $(event.target),
                    value = $option.data('value');
                this.setValue(value);
            }
        });
});

