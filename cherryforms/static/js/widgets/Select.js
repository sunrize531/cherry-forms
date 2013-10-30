define(['underscore', 'backbone', 'core', 'utils'], function (_, Backbone, CherryForms, Utils) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,

        Models = CherryForms.Models,
        Fields = CherryForms.Fields,
        Field = Fields.Field,

        Templates = CherryForms.Templates,
        Events = CherryForms.Events,
        BackboneModel = Backbone.Model,
        isSimple = Utils.isSimple,
        isUnset = Utils.isUnset,
        Unset = Utils.Unset,

        Option = Models.Option = BackboneModel.extend({
            defaults: {
                value: null,
                selected: false,
                hidden: false
            },

            initialize: function (attributes, options) {
                _.defaults(this.attributes,
                    {'title': this.get('value')});
            },

            isEqual: function (other) {
                if (isSimple(other)) {
                    return (String(this.get('value')) === String(other));
                }
                if (other instanceof Backbone.Model) {
                    return this.get('value') === other.get('value');
                }
                if (_.isObject(other)) {
                    return this.get('value') === other['value'];
                }
                return false;
            },

            hide: function () {
                this.set({
                    hidden: true,
                    selected: false
                });
            }
        }),

        Choices = Models.Choices = Backbone.Collection.extend({
            model: function (attributes, options) {
                if (isSimple(attributes)) {
                    attributes = {value: attributes};
                } else if (_.isArray(attributes)) {
                    attributes = {value: attributes[0], title: attributes[1]};
                }
                return new Option(attributes, options);
            },

            get: function (value) {
                if (value instanceof Option && _.has(this._byId, value.cid)) {
                    return value;
                }
                return this.find(function (option) {
                    return option.isEqual(value);
                });
            },

            removeOption: function (value) {
                var option = this.get(value);
                this.remove(option);
            },

            selected: function () {
                return this.find(function (option) {
                    return option.get('selected') === true;
                });
            },

            def: function () {
                return this.find(function (option) {
                    return option.get('hidden') === false;
                });
            },

            select: function (value, options) {
                var previous = this.selected(),
                    current = this.get(value) || this.def();

                if (!_.isUndefined(previous)) {
                    previous.set('selected', false, {silent: true});
                }
                if (!_.isUndefined(current)) {
                    current.set('selected', true, options);
                    return current;
                }
                return undefined;
            }
        }),

        SelectField = Fields.Select = Field.extend({
            initialize: function () {
                var choices = this.choices = this._getChoices(this.get('choices'));
                if (!this.get('not_null')) {
                    choices.unshift([new Unset(), '-']);
                } else if (_.isNull(this.get('value')) || _.isUndefined(this.get('value'))) {
                    this.set('value', choices.def().get('value'));
                }
                this.listenTo(choices, 'remove', this._onRemoveOption);
                this.listenTo(choices, 'change:selected', this._onSelectOption);
                Field.prototype.initialize.apply(this, arguments);
            },

            _getChoices: function (choices) {
                if (!(choices instanceof Choices)) {
                    return new Choices(choices);
                }
                return choices;
            },

            _onRemoveOption: function (option) {
                if (this.value === option) {
                    this.setValue(undefined);
                }
            },

            _onSelectOption: function (option) {
                option = this.choices.get(option);
                if (option.get('selected') && this.value !== option) {
                    this.value = option;
                    this.set('value', option.get('value'), {silent: true});
                } else {
                    this.choices.select();
                }
            },

/*
            TODO: fix for Backbone 0.9.9
            validate: function (attributes, options) {
                var value = attributes['value'],
                    error = false,
                    choices = this.choices || this._getChoices(attributes['choices']);
                console.debug('Select.validate', attributes);
                if (_.isUndefined(value) && attributes['not_null']) {
                    error = 'Value cannot be undefined';
                } else if (!_.isUndefined(value) && _.isUndefined(choices.get(value))) {
                    error = 'There is no option for value ' + value;
                }
                if (error) {
                    console.error(error);
                }
                return error;
            },
*/

            processValue: function () {
                this.value = this.choices.select(this.get('value'));
                this.trigger(Events.FIELD_CHANGE, this);
            },

            unsetValue: function () {
                var option = this.choices.def();
                this.choices.select(option);
                Field.prototype.unsetValue.call(this);
            },

            dumpValue: function () {
                if (isUnset(this.value)) {
                    return this.value;
                }
                return this.value.get('value');
            },

            plainValue: function () {
                return this.dumpValue();
            }
        }),

        OptionTemplate = Templates.Option = _.template(
            '<option value="{{ value }}"{% if (selected) { %} selected{% } %}>' +
                '{% if (title) { %}{{ title }}{% } else { %}{{ value }}{% } %}</option>'
        ),

        SelectTemplate = Templates.Select = _.template(
        '<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<select id="{{ input_id }}" class="{{ input_class }}"></select>' +
        '</div>'),

        SelectWidget = Widgets.Select = Widget.extend({
            FieldModel: SelectField,
            template: Templates.Select,
            optionsTemplate: Templates.Option,

            initialize: function (options) {
                Widget.prototype.initialize.apply(this, arguments);
                var choices = this.choices = this.model.choices;
                this.listenTo(choices, 'add', this.renderOption);
                this.listenTo(choices, 'remove', this.detachOption);
                this.listenTo(choices, 'change:selected', this.updateOption);
                this.listenTo(choices, 'change:hidden', this.hideOption);
            },

            $getOption: function (option) {
                return this.getInput().find('option[value="' + option.get('value') + '"]');
            },

            addOption: function (option) {
                this.choices.add(option);
            },

            removeOption: function (option) {
                this.choices.removeOption(option);
            },

            renderOption: function (option) {
                option = this.choices.get(option);
                if (!_.isUndefined(option)) {
                    var optionTemplate = this.getTemplate(this.optionsTemplate),
                        optionData = _.defaults(option.toJSON(), this.model.toJSON()),
                        $option = $(optionTemplate(optionData)).appendTo(this.getInput());
                    if (option.get('hidden')) {
                        $option.hide();
                    }
                }
            },

            detachOption: function (option) {
                this.$getOption.detach();
                if (option.get('selected')) {
                    this.setValue(undefined);
                }
            },

            updateOption: function (option) {
                this.$getOption(option).prop(
                    'selected',
                    option.get('selected')
                );
            },

            hideOption: function (option) {
                if (option.get('hidden')) {
                    this.$getOption(option).hide();
                } else {
                    this.$getOption(option).show();
                }
            },

            render: function () {
                Widget.prototype.render.call(this);
                var $select = this.getInput();
                $select.append(this.choices.map(this.renderOption, this));
            }
        });

    return CherryForms;
});
