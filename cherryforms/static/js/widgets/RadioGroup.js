define(['underscore', 'backbone', 'core', 'widgets/Select',
    'less!chf-pills.less'], function (_, Backbone, CherryForms) {
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
            FieldModel: RadioGroupField,
            template: _.template('<label>{{ label }}</label>' +
                '<div id="{{ input_id }}" class="btn-group {{ group_class }}" data-toggle="buttons-radio"></div>'),
            optionsTemplate: _.template('<button type="button" class="btn btn-mini {{ button_class }}">' +
                '{{ title }}</button>'),

            $getOption: function (option) {
                return this.getInput().find(
                    '.' + this.model.get('pill_class') + '[data-value="' + option.get('value') + '"]');
            },

            events: function () {
                var events = {};
                events['click .' + this.model.get('pill_class')] = '_onPillClick';
                return events;
            },

            updateOption: function (option) {
                var selected = Boolean(option.get('selected')),
                    $li = this.$getOption(option).parent('li');
                this.$('li').removeClass('active');
                if (selected) {
                    $li.addClass('active');
                }
            },

            _onPillClick: function (event) {
                var $pill = $(event.target),
                    value = $pill.data('value');
                this.setValue(value);
                return false;
            }
        });
});

