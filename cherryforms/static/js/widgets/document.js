define(['underscore', 'backbone', 'core',
    'widgets/text', 'widgets/select', 'widgets/checkbox', 'widgets/list'],
    function (_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,

        Models = CherryForms.Models,
        Schema = Models.Schema,

        Fields = CherryForms.Fields,
        Field = Fields.Field,

        Events = CherryForms.Events,

        EmbeddedDocument = Models.EmbeddedDocument = Backbone.Model.extend({
        }),

        DocumentField, DocumentWidget;

    DocumentField = Fields.Document = Field.extend({
        defaults: function () {
            return _.extend({}, Field.prototype.defaults.call(this), {
                'field_class': 'chf-field-document',
                'editor_class': 'chf-editor',
                'widget_class': ''
            });
        },

        initialize: function (attributes) {
            Field.prototype.initialize.apply(this, arguments);
            this.schema = new Schema(this.get('schema'));
            this.schema.each(function (field) {
                field.set('value', this.value.get(field.get('field')));
            }, this);
            this.schema.on(Events.FIELD_CHANGE, this._onFieldChange, this);
        },

        _onFieldChange: function (field) {
            this.value.set(field.get('field'), field.plainValue());
            this.trigger(Events.FIELD_CHANGE, this);
        },

        processValue: function () {
            this.value = new EmbeddedDocument(this.get('value'));
            this.value.on('change', function () {
                this.trigger(Events.FIELD_CHANGE, this);
            }, this);
            this.trigger(Events.FIELD_CHANGE, this);
        },

        toJSON: function () {
            return _.extend(Field.prototype.toJSON.call(this), {
                json_repr: this.dumpValue()
            });
        },

        dumpValue: function () {
            return JSON.stringify(this.plainValue());
        },

        plainValue: function () {
            return this.value.toJSON();
        }
    });

    DocumentWidget = Widgets.Document = Widget.extend({
        template: _.template('<div class="control-group">' +
            '<label>{{ label }}</label>' +
            '<div class="accordion-group">' +
                '<div class="accordion-heading">' +
                    '<a href="#{{ input_id }}-editor" class="accordion-toggle" data-toggle="collapse">' +
                        '{{ json_repr }}</a>' +
                '</div>' +
                '<div class="accordion-body collapse" id="{{ input_id }}-editor">' +
                    '<div class="accordion-inner {{ editor_class }}"></div>' +
                '</div>' +
            '</div>' +
        '</div>'),
        FieldModel: DocumentField,

        getEditor: function () {
            if (_.isUndefined(this._editor)) {
                this._editor = this.$('.' + this.model.get('editor_class'));
            }
            return this._editor;
        },

        render: function () {
            Widget.prototype.render.call(this);
            this.getEditor().append(
                this.model.schema.map(function (field) {
                    var widget = new Widgets[field.get('widget')]({
                        model: field,
                        idAttribute: field.id
                    });
                    return widget.render().el;
                }, this)
            );
            return this;
        }
    });

});
