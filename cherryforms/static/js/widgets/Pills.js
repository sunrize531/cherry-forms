define(['underscore', 'backbone', 'core', 'widgets/Select',
    'less!chf-pills.less'], function (_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        SelectField = Fields.Select,

        PillsField = Fields.Pills = SelectField.extend({
            defaults: function () {
                return _.extend(SelectField.prototype.defaults.call(this), {
                    'not_null': true,
                    'label_class': 'chf-field-label',
                    'pills_class': 'chf-pills',
                    'pill_class': 'chf-pill'
                });
            }
        }),

        PillsWidget = Widgets.Pills = Widgets.Select.extend({
            FieldModel: PillsField,
            template: _.template('<ul class="nav nav-pills {{ pills_class }}" id="{{ input_id }}">' +
                '<li class="disabled"><a>{{ label }}</a></li></ul>'),
            optionsTemplate: _.template('<li{% if (selected) { %} class="active"{% } %}>' +
                '<a href="#" data-value="{{ value }}" class="{{ pill_class }}">{{ title }}</a></li>'),

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

