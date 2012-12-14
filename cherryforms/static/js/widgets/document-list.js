define(['underscore', 'backbone', 'core',
    'widgets/document',
    'less!chf-document-list.less'], function (_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        DocumentWidget = Widgets.Document,

        Models = CherryForms.Models,
        Schema = Models.Schema,
        EmbeddedDocument = Models.EmbeddedDocument,

        Fields = CherryForms.Fields,
        Field = Fields.Field,
        DocumentField = Fields.Document,

        Events = CherryForms.Events,

        REORDER_EVENT = 'field:document-list:reorder',
        REMOVE_EVENT = 'field:document-list:remove',
        COPY_EVENT = 'field:document-list:copy',
        LIST_CHANGED_EVENT = 'field:document-list:change',

        DocumentList = Backbone.Collection.extend({
            model: EmbeddedDocument,

            initialize: function () {
                this.on(REORDER_EVENT, this.reorderDocument, this);
                this.on(REMOVE_EVENT, this.removeDocument, this);
                this.on(COPY_EVENT, this.createDocument, this);
            },

            reorderDocument: function (document, offset) {
                var currentIndex = this.indexOf(document),
                    newIndex = currentIndex + offset,
                    length = this.length;
                if (newIndex >= 0 && newIndex < length && newIndex !== currentIndex) {
                    this.remove(document, {silent: true});
                    this.add(document, {at: newIndex, silent: true});
                    this.trigger(LIST_CHANGED_EVENT, this);
                }
            },

            removeDocument: function (document) {
                this.remove(document, {silent: true});
                this.trigger(LIST_CHANGED_EVENT, this);
            },

            createDocument: function (attributes) {
                if (attributes instanceof Backbone.Model) {
                    attributes = attributes.toJSON();
                } else {
                    attributes = attributes || {};
                }
                this.add(attributes);
                this.trigger(LIST_CHANGED_EVENT, this);
            },

            reset: function () {
                Backbone.Collection.prototype.reset.apply(this, arguments);
                this.trigger(LIST_CHANGED_EVENT, this);
            }
        }),

        ListedDocumentField = DocumentField.extend({
            defaults: function () {
                return _.extend({}, DocumentField.prototype.defaults.call(this), {
                    'move_up_icon': 'chf-icon-move-up',
                    'move_down_icon': 'chf-icon-move-down',
                    'copy_icon': 'chf-icon-copy',
                    'trash_icon': 'chf-icon-trash',
                    'controls_class': 'chf-controls'
                });
            }
        }),

        ListedDocumentWidget = DocumentWidget.extend({
            template: _.template('<div class="accordion-group">' +
                '<div class="accordion-heading"><div class="row-fluid">' +
                    '<div class="span10">' +
                        '<a href="#{{ input_id }}-editor" class="accordion-toggle" data-toggle="collapse">' +
                            '{{ json_repr }}</a>' +
                    '</div>' +
                    '<div class="span2"><div class="{{ controls_class }} btn-group">' +
                        '<a href="#" class="btn btn-mini {{ move_up_icon }}">' +
                            '<i class="icon-circle-arrow-up"></i></a> ' +
                        '<a href="#" class="btn btn-mini {{ move_down_icon }}">' +
                            '<i class="icon-circle-arrow-down"></i></a> ' +
                        '<a href="#" class="btn btn-mini {{ copy_icon }}">' +
                            '<i class="icon-copy"></i></a> ' +
                        '<a href="#" class="btn btn-mini btn-danger {{ trash_icon }}">' +
                            '<i class="icon-trash icon-white"></i></a>' +
                    '</div></div>' +
                '</div></div>' +
                '<div class="accordion-body collapse" id="{{ input_id }}-editor">' +
                    '<div class="accordion-inner {{ editor_class }}"></div>' +
                '</div>' +
            '</div>'),

            events: function () {
                var events = DocumentWidget.prototype.events.apply(this);
                events['click .' + this.model.get('move_up_icon')] = '_onMoveUpClick';
                events['click .' + this.model.get('move_down_icon')] = '_onMoveDownClick';
                events['click .' + this.model.get('copy_icon')] = '_onCopyClick';
                events['click .' + this.model.get('trash_icon')] = '_onTrashClick';
                return events;
            },

            _triggerDocumentEvent: function () {
                var document = this.model.value,
                    args = _.toArray(arguments).unshift(document);
                document.trigger.apply(document, args);
            },

            _onMoveUpClick: function () {
                var document = this.model.value;
                document.trigger(REORDER_EVENT, document, -1);
                return false;
            },

            _onMoveDownClick: function () {
                var document = this.model.value;
                document.trigger(REORDER_EVENT, document, 1);
                return false;
            },

            _onCopyClick: function () {
                var document = this.model.value;
                document.trigger(COPY_EVENT, document);
                return false;
            },

            _onTrashClick: function () {
                var document = this.model.value;
                document.trigger(REMOVE_EVENT, document);
                return false;
            }
        }),

        DocumentListField = Fields.DocumentList = Field.extend({
            defaults: function () {
                return _.extend({}, Field.prototype.defaults.call(this), {
                    'field_class': 'chf-field-document-list',
                    'items_class': 'chf-items',
                    'controls_class': 'chf-controls',
                    'create_button': 'chf-btn-create',
                    'clear_button': 'chf-btn-clear',
                    'widget_class': ''
                });
            },

            initialize: function (attributes) {
                this.schema = new Schema(this.get('schema'));
                this.fields = new Schema();
                Field.prototype.initialize.apply(this, arguments);
            },

            _onFieldChange: function (field) {
                this.trigger(Events.FIELD_CHANGE, this);
            },

            processValue: function () {
                this._resetFields(this.get('value'));
                this.trigger(Events.FIELD_CHANGE, this);
            },

            _resetFields: function (value) {
                var schema = this.schema.toJSON(),
                    documents = value,
                    collection = this.value = new DocumentList(),
                    fields = this.fields.reset([], {silent: true});

                if (value instanceof Backbone.Collection) {
                    documents = documents.toJSON();
                }

                _.each(documents, function (document) {
                    var field = new ListedDocumentField({value: document, schema: schema});
                    field.on(Events.FIELD_CHANGE, this._onFieldChange, this);
                    fields.add(field, {silent: true});
                    collection.add(field.value, {silent: true});
                }, this);

                fields.trigger('reset', fields);
                collection.trigger(LIST_CHANGED_EVENT, collection);
                collection.on(LIST_CHANGED_EVENT, this._resetFields, this);
                this.trigger(Events.FIELD_CHANGE, this);

            },

            dumpValue: function () {
                return JSON.stringify(this.plainValue());
            },

            plainValue: function () {
                return this.value.toJSON();
            }
        }),

        DocumentListWidget = Widgets.DocumentList = Widget.extend({
            template: _.template('<div class="control-group">' +
                '<label>{{ label }}</label>' +
                '<div class="accordion {{ items_class }}"></div>' +
                '<div class="btn-block {{ controls_class }}">' +
                    '<a href="#" class="btn btn-mini {{ create_button }}">' +
                        '<i class="icon-file"></i> Add document</a> ' +
                    '<a href="#" class="btn btn-mini btn-danger {{ clear_button }}">' +
                        '<i class="icon-trash"></i> Clear</a>' +
                '</div>' +
            '</div>'),
            FieldModel: DocumentListField,

            initialize: function () {
                Widget.prototype.initialize.apply(this, arguments);
                this.model.fields.on('reset', this._renderItems, this);
            },

            events: function () {
                var events = {};
                events['click .' + this.model.get('create_button')] = '_onAddClick';
                events['click .' + this.model.get('clear_button')] = '_onClearClick';
                return events;
            },

            render: function () {
                Widget.prototype.render.call(this);
                this._renderItems();
            },

            _renderItems: function () {
                this.$items = this.$('.' + this.model.get('items_class')).html(
                    this.model.fields.map(function (field) {
                        var widget = new ListedDocumentWidget({model: field}),
                            el = widget.render().el;
                        return widget.el;
                    }, this)
                );
            },

            _onAddClick: function () {
                this.model.value.createDocument();
                return false;
            },

            _onClearClick: function () {
                this.model.value.reset();
                return false;
            }
        });
});
