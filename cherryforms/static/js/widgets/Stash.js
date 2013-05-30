define(['underscore', 'backbone', 'core', 'utils',
    'widgets/Text',
    'less!chf-stash.less'], function (_, Backbone, CherryForms, Utils) {
    "use strict";
    var Models = CherryForms.Models,
        Schema = Models.Schema,

        Fields = CherryForms.Fields,
        Field = Fields.Field,
        TextField = Fields.Text,

        Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        TextWidget = Widgets.Text,

        Templates = CherryForms.Templates,
        Events = CherryForms.Events,

        Unset = Utils.Unset,
        isUnset = Utils.isUnset,

        ResourceType = Models.Document.extend({
            tagged: function (tags) {
                if (_.isArray(tags) && tags.length) {
                    return Boolean(_.intersection(this.get('tags'), tags).length);
                }
                return true;
            },

            filter: function (filter) {
                var weight, matched, index, chars, pattern, re, replace,
                    id = String(this.id);
                if (filter) {
                    index = id.indexOf(filter);
                    if (index > -1) {
                        if (index === 0) {
                            weight = 2;
                        } else {
                            weight = index / id.length + 1;
                        }
                        matched = id.replace(filter, '<strong>' + filter + '</strong>');
                    } else {
                        chars = filter.replace(/\s+/, '').split('');
                        pattern = _.map(chars, function (c) {
                            return '(' + c + ')';
                        }).join(' (.*) ').split(/\s+/);
                        re = new RegExp(pattern.join(''), 'i');
                        if (re.test(id)) {
                            weight = 1;
                            replace = _.map(pattern, function (s, i) {
                                var r = '$' + (i + 1);
                                if (i % 2 === 0) {
                                    return '<strong>' + r + '</strong>';
                                }
                                return r;
                            }).join('');
                            matched = id.replace(re, replace);
                        } else {
                            weight = 0;
                            matched = id;
                        }
                    }
                } else {
                    weight = 1;
                    matched = id;
                }
                this.set({weight: weight, matched: matched});
                return weight;
            }
        }),

        DocumentsCollection = Models.DocumentsCollection,
        ResourcesCollection = DocumentsCollection.extend({
            model: ResourceType,

            initialize: function () {
                DocumentsCollection.prototype.initialize.apply(this, arguments);
                this
                    .on('add', this.resetTags, this)
                    .on('remove', this.resetTags, this)
                    .on('reset', this.resetTags, this);
            },

            resetTags: function () {
                this._tags = undefined;
            },

            getTags: function () {
                if (_.isUndefined(this._tags)) {
                    var tagSet = {};
                    this.each(function (resource) {
                        var tags = resource.get('tags');
                        if (_.isArray(tags)) {
                            _.each(tags, function (tag) {
                                tagSet[tag] = true;
                            });
                        }
                    });
                    this._tags = _.keys(tagSet);
                    this._tags.sort();
                }
                return this._tags;
            },

            filterResources: function (tags, filter) {
                var filtered = [];
                this.each(function (resource) {
                    if (resource.tagged(tags)) {
                        var weight = resource.filter(filter);
                        if (weight) {
                            filtered.push({
                                weight: weight,
                                resource: resource
                            });
                        }
                    }
                }, this);
                filtered = _.sortBy(filtered, function (entry) {
                    return (2 - entry.weight).toFixed(2) + '_' + entry.resource.id;
                });
                return _.pluck(filtered, 'resource');
            }
        }),
        resources = {},

        Stash = Backbone.Model.extend({
            each: function (iterator, context) {
                _.each(this.attributes, iterator, context);
            },

            map: function (iterator, context) {
                return _.map(this.attributes, iterator, context);
            }
        }),

        STASH_VALUE_PATTERN = /^\d+(:\d+)?([%!#*]\d+)?$/,
        StashItemField = TextField.extend({
            pattern: /^\d+(:\d+)?([%!#*]\d+)?$/
        }),

        StashItemWidget = TextWidget.extend({
            FieldModel: StashItemField,
            className: 'chf-field-item',
            template: _.template(
                '<div class="control-group">' +
                    '<div class="control-label">{{ label }}</div>' +
                    '<div class="controls">' +
                        '<div class="input-append input-large">' +
                            '<input type="text" id="{{ input_id }}" value="{{ value }}" class="input-medium">' +
                            '<a class="btn {{ add_button }}"><i class="icon-plus"></i></a>' +
                            '<a class="btn {{ clear_button }}"><i class="icon-trash"></i></a>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            ),

            events: function () {
                var events = TextWidget.prototype.events.call(this);
                events['click .' + this.model.get('clear_button')] = 'clearValue';
                events['click .' + this.model.get('add_button')] = 'addValue';
                return events;
            },

            clearValue: function () {
                this.model.unsetValue();
                this.$el.detach();
            },

            addValue: function () {
                var num = Number(this.model.value);
                if (_.isNumber(num)) {
                    this.model.set('value', num + 1);
                }
            }
        }),

        CreateItemWidget = TextWidget.extend({
            template: _.template('<div class="control-group">' +
                '<div class="input-append">' +
                    '<input type="text" id="{{ input_id }}" class="input-medium" placeholder="Enter resource id...">' +
                    '<a href="#" class="btn {{ add_button }}"><i class="icon-plus"></i></a>' +
                '</div>' +
            '</div>')
        }),

        ResourcesFilterWidget = TextWidget.extend({
            events: function (events) {
                events = events || {};
                events['keyup #' + this.getInputID()] = 'onChange';
                return events;
            }
        }),

        StashField = Fields.Stash = Field.extend({
            defaults: function () {
                return (_.extend({}, Field.prototype.defaults.call(this), {
                    'editor_class': 'chf-field-editor',
                    'selector_class': 'chf-field-selector',
                    'selector_content_class': 'chf-field-selector',
                    'tags_class': 'chf-field-tags',
                    'toggle_class': 'chf-stash-toggle',
                    'filters_class': 'chf-stash-filters',
                    'filter_class': 'chf-stash-filter',
                    'resources_class': 'chf-stash-resources',
                    'resource_class': 'chf-field-item',
                    'create_class': 'chf-stash-create',
                    'item_class': 'chf-field-item',
                    'clear_button': 'chf-btn-clear',
                    'add_button': 'chf-btn-add',
                    'resources_url': '/widgets/resources'
                }));
            },

            initialize: function () {
                this.schema = new Schema();
                this.schema
                    .on(Events.FIELD_CHANGE, this._onFieldChange, this)
                    .on(Events.FIELD_CLEAR, this._onFieldClear, this);
                this.createItemField = new Fields.Identifier(_.pick(this.toJSON(), 'add_button'));
                Field.prototype.initialize.apply(this, arguments);

                // Init resources collection
                var url = this.get('resources_url'),
                    resourcesCollection = resources[url];
                if (_.isUndefined(resourcesCollection)) {
                    resourcesCollection = new ResourcesCollection({'url': url});
                }
                this.resourcesCollection = resourcesCollection;
            },

            processValue: function () {
                var value = this.get('value'),
                    input_id = this.get('input_id');
                if (_.isUndefined(value)) {
                    this.unsetValue();
                } else {
                    this.value = new Stash(value);
                    this.value.on('change', this._onStashChange, this);
                    this.schema.reset(this.value.map(function (value, res) {
                        return this._createItemField(res, value);
                    }, this));
                }
                this.trigger(Events.FIELD_CHANGE, this);
            },

            unsetValue: function () {
                if (!isUnset(this.value)) {
                    this.value = new Unset();
                    this.schema.reset();
                    this.trigger(Events.FIELD_CLEAR, this);
                }
            },

            _createItemField: function (res, value) {
                return new StashItemField(_.extend({
                    field: res,
                    value: value
                }, _.pick(this.toJSON(), 'add_button', 'clear_button')));
            },

            _onFieldChange: function (field) {
                var res = field.get('field');
                this.value.set(res, field.value, {silent: true});
                this.trigger(Events.FIELD_CHANGE, this);
            },

            _onFieldClear: function (field) {
                this.value.unset(field.get('field'), {silent: true});
                this.schema.remove(field);
                this.trigger(Events.FIELD_CHANGE, this);
            },

            _onStashChange: function () {
                var schema = this.schema,
                    field;
                this.value.each(function (value, res) {
                    field = schema.find(function (field) {
                        return field.get('field') === res;
                    });
                    if (_.isUndefined(field)) {
                        schema.add(this._createItemField(res, value));
                    }
                }, this);
            }
        });

    Widgets.Stash = Widget.extend({
        FieldModel: StashField,
        template: _.template('<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<div class="row-fluid">' +
                '<div class="span7">' +
                    '<div class="well form-horizontal {{ editor_class }}"></div>' +
                '</div>' +
                '<div class="span5">' +
                    '<div class="{{ filters_class }}">' +
                        '<div class="btn-group" data-toggle="buttons-radio">' +
                            '<a href="#" class="btn btn-mini active" rel="new">New</a>' +
                            '<a href="#" class="btn btn-mini disabled" rel="filter">Filter</a>' +
                            '<a href="#" class="btn btn-mini disabled" rel="tags">Tags</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="{{ create_class }}" id="{{ input_id }}-new-resource"></div>' +
                '</div>' +
            '</div>' +
        '</div>'),

        events: function () {
            var events = {};
            events['click .' + this.model.get('create_class') + ' .' + this.model.get('add_button')] = '_createItem';
            return events;
        },

        getEditor: function () {

        },

        render: function () {
            Widget.prototype.render.call(this);
            var schema = this.model.schema
                .on('add', this._onItemFieldAdded, this)
                .on('reset', this._onSchemaReset, this);
            this.$editor = this.$('.' + this.model.get('editor_class')).append(
                schema.map(this._renderItemField)
            );
            this.createItemWidget = new CreateItemWidget({
                model: this.model.createItemField,
                el: this.$('.' + this.model.get('create_class'))
            });
            this.createItemWidget.render();
        },

        _renderItemField: function (field) {
            var widget = new StashItemWidget({
                model: field,
                id: field.id
            });
            return widget.render().el;
        },

        _createItem: function () {
            var newItemID = this.model.createItemField.value;
            if (!isUnset(newItemID)) {
                this.model.value.set(newItemID, 1);
            }
        },

        _onItemFieldAdded: function (field) {
            this.$editor.append(this._renderItemField(field));
        },

        _onSchemaReset: function () {
            this.$editor
                .empty()
                .append(this.schema.map(this._renderItemField, this));
        }
    });

    Templates.Stash = _.template(
        '{{ label }}<div class="row">' +
                '<div class="span7">' +
                    '<div class="well form-horizontal {{ editor_class }}"></div>' +
                '</div>' +
                '<div class="span5 {{ selector_class }}">' +
                    '<div class="{{ toggle_class }}">' +
                        '<div class="btn-group">' +
                            '<a href="#" class="btn btn-mini" rel="filter">Filter</a>' +
                            '<a href="#" class="btn btn-mini" rel="tags">Tags</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="{{ filters_class }}"></div>' +
                    '<div class="{{ resources_class }}"></div>' +
                '</div>' +
            '</div>'
    );

    Templates.StashResourceFilter = _.template(
        '<input type="text" id="{{ input_id }}" value="{{ value }}" ' +
            'class="input-block-level" placeholder="Type here to filter resources...">'
    );
    Templates.StashResource = _.template('<a href="#" class="{{ resource_class }}">{{ matched }}</a>');
});