define(['underscore', 'backbone', 'core', 'widgets/Text', 'widgets/Select',
    'less!chf-list.less'], function (_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Models = CherryForms.Models,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Templates = CherryForms.Templates,
        Events = CherryForms.Events,
        ListField, ListItem, ListItems, ListItemView,

        newItemTextTemplate = _.template(
            '<div class="input-append">' +
                '<input type="text" id="{{ input_id }}" value="{{ value }}">' +
                '<a class="btn {{ add_button }}" href="#"><i class="icon-plus"></i></a>' +
            '</div>'),

        newItemSelectTemplate = _.template(
            '<div class="input-append">' +
                '<select id="{{ input_id }}"></select>' +
                '<a class="btn {{ add_button }}" href="#"><i class="icon-plus"></i></a>' +
            '</div>'),

        listWidgetTemplate = _.template(
            '<div class="control-group">' +
                '<div class="control-label">{{ label }}</div>' +
                '<div class="well well-small {{ items_class }}"></div>' +
                '{% if (!read_only) { %}' +
                    '<div class="{{ new_item_class }}">' +
                        '<div class="{{ new_item_field }}"></div>' +
                    '</div>' +
                '{% } %}' +
            '</div>'
        );

    ListItem = Backbone.Model.extend({
    });

    ListItems = Backbone.Collection.extend({
        initialize: function (models, options) {
            this.choices = options['choices'];
            this.inputID = options['input_id'];
        },

        model: function (value, options) {
            var collection = options['collection'],
                choices = collection.choices,
                inputID = collection.inputID,
                item = {
                    id: _.uniqueId(inputID + '-item-'),
                    value: value,
                    title: value
                },
                option;
            if (choices) {
                option = choices.get(value);
                if (!_.isUndefined(option)) {
                    item['title'] = option.get('title');
                } else {
                    console.warn('List item not listed in choices.', item);
                }
            }
            return new ListItem(item, options);
        },

        getItem: function (value) {
            return this.find(function (item) {
                return item.get('value') === value;
            });
        }
    });

    ListField = Fields.List = Field.extend({
        initialize: function () {
            var choices = this.get('choices');
            if (_.isArray(choices)) {
                this.choices = new Models.Choices(choices);
            }
            Field.prototype.initialize.apply(this, arguments);
        },

        defaults: function () {
            return _.extend({}, Field.prototype.defaults.call(this), {
                field_class: 'chf-field-list',
                items_class: 'chf-field-items',
                new_item_class: 'chf-field-new-item',
                trash_icon: 'chf-icon-trash',
                new_item_field: 'chf-field-new-field',
                add_button: 'chf-btn-add',
                read_only: false,
                unique: false
            });
        },

        validate: function (attributes, options) {
            var value = attributes['value'],
                unique = attributes['unique'],
                valueHash, uniqueHash;
            if (!(_.isArray(value) || _.isUndefined(value))) {
                return 'Invalid value';
            }
            if (unique && _.isArray(value)) {
                valueHash = _.clone(value);
                valueHash.sort();
                uniqueHash = _.uniq(value);
                uniqueHash.sort();
                if (valueHash.toString() !== uniqueHash.toString()) {
                    return 'Provided array is not unique';
                }
            }
            return false;
        },

        processValue: function () {
            var choices = this.choices,
                value;
            value = this.value = new ListItems(this.get('value'), {
                choices: choices,
                input_id: this.get('input_id')
            });

            value
                .on('add', this._onItemAdded, this)
                .on('remove', this._onItemRemoved, this);

            if (this.get('unique') && choices) {
                value.each(this._hideOption, this);
            }
            this.trigger(Events.FIELD_CHANGE, this);
        },

        _onItemAdded: function (item) {
            if (this.get('unique') && this.choices) {
                this._hideOption(item);
            }
            this.trigger(Events.FIELD_CHANGE, this);
        },

        _hideOption: function (item) {
            var option = this.choices.get(item);
            option.hide();
        },

        _onItemRemoved: function (item) {
            if (this.get('unique') && this.choices) {
                var option = this.choices.get(item);
                option.set('hidden', false);
            }
            this.trigger(Events.FIELD_CHANGE, this);
        },

        dumpValue: function () {
            return JSON.stringify(this.plainValue());
        },

        plainValue: function () {
            return this.value.pluck('value');
        }
    });

    ListItemView = Backbone.View.extend({
        template: _.template(
            '<span>{{ title }}</span>' +
            '{% if (!read_only) { %}&nbsp;<a href="#" class="red {{ trash_icon }}">' +
                '<i class="icon-trash"></i></a>{% } %}'),

        events: function () {
            var events = {},
                url_template = this.options['url_template'],
                read_only = this.options['read_only'];
            if (url_template) {
                events['click'] = '_openURL';
            }
            if (!read_only) {
                events['click .' + this.options['trash_icon']] = '_removeItem';
            }
            return events;
        },

        render: function () {
            this.$el.html(this.template(_.extend({}, this.options, this.model.toJSON())));
            return this;
        },

        _openURL: function () {
            window.location.assign(_.template(
                this.options['url_template'],
                _.extend({}, this.options, this.model.toJSON())
            ));
            return false;
        },

        _removeItem: function (event) {
            this.model.collection.remove(this.model);
            this.$el.detach();
            return false;
        }
    });

    Widgets.List = Widget.extend({
        className: 'chf-field-list',
        FieldModel: ListField,
        template: listWidgetTemplate,

        events: function () {
            var events = {};
            events['click .' + this.model.get('add_button')] = 'addItem';
            return events;
        },

        initialize: function () {
            Widget.prototype.initialize.apply(this, arguments);
            this.model.bind('change:value', this._onItemsChanged, this);
            this._onItemsChanged();
        },

        _onItemsChanged: function () {
            var items = this.model.value;
            items
                .on('add', this._onItemAdded, this)
                .on('remove', this._onItemRemoved, this);
        },

        _onItemAdded: function (item) {
            this.renderItem(item);
        },

        _onItemRemoved: function (item) {
        },

        isUnique: function () {
            return Boolean(this.model.get('unique'));
        },

        renderItem: function (item) {
            var itemView = new ListItemView(_.extend({
                        model: item,
                        className: this.model.get('item_class'),
                        idAttribute: item.id
                    },
                    _.pick(this.model.toJSON(), 'input_id', 'read_only', 'trash_icon', 'url_template')
                ));
            this.$getItems().append(itemView.render().el);
            return this;
        },

        $getItems: function () {
            if (_.isUndefined(this.$items)) {
                this.$items = this.$('.' + this.model.get('items_class'));
            }
            return this.$items;
        },

        render: function () {
            Widget.prototype.render.call(this);

            var choices = this.model.choices,
                readOnly = this.model.get('read_only'),
                $newItemField = this.$('.' + this.model.get('new_item_field'));

            if (!readOnly) {
                if (!_.isUndefined(choices)) {
                    this.newItemField = new Widgets.Select({
                        template: newItemSelectTemplate,
                        el: $newItemField,
                        not_null: true,
                        choices: choices,
                        add_button: this.model.get('add_button')
                    });
                    this.model.choices = this.newItemField.choices;
                } else {
                    this.newItemField = new Widgets.Text({
                        template: newItemTextTemplate,
                        el: $newItemField,
                        add_button: this.model.get('add_button')
                    });
                }
                this.newItemField.render();
            } else if (!_.isUndefined(choices)) {
                this.choices = new Models.Choices(choices);
            }

            this.model.value.each(this.renderItem, this);
            return this;
        },

        addItem: function () {
            this.model.value.add(this.newItemField.model.dumpValue());
            this.trigger(Events.FIELD_CHANGE, this);
            return false;
            // TODO: Remove option from selector, if any...
        }
    });
});