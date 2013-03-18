define(['underscore', 'backbone', 'handsontable', 'core',
    'less!chf-document-grid.less', 'css!jquery.handsontable.css'], function (_, Backbone, Handsontable, CherryForms) {
    "use strict";

    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,

        Models = CherryForms.Models,
        Schema = Models.Schema,
        Document = Models.Document,

        Fields = CherryForms.Fields,
        Field = Fields.Field,

        Events = CherryForms.Events,
        bullocks = function() {
            console.debug('bullocks', arguments);
            return false;
        },

        Row = Document.extend({
            toJSON: function () {
                return _.extend({}, Document.prototype.toJSON.call(this), {
                    _control: this.id
                });
            }
        }),

        DocumentGrid = Backbone.Collection.extend({
            model: Row
        }),

        DocumentGridField = Fields.DocumentGrid = Field.extend({
            defaults: function () {
                return _.extend({}, Field.prototype.defaults.call(this), {
                    'grid_class': 'chf-grid',
                    'controls_class': 'chf-controls',
                    'button_cell': 'chf-button-cell'
                });
            },

            initialize: function () {
                Field.prototype.initialize.apply(this, arguments);
            },

            processValue: function () {
                this.value = new DocumentGrid(this.get('value'));
                this.trigger(Events.FIELD_CHANGE, this);
            },

            gridHeaders: function () {
                return this.get('fields');
            },

            gridColumns: function () {
                return _.map(this.get('fields'), function (field) {
                    return  {
                        data: field
                    };
                });
            },

            gridData: function () {
                if (!_.isUndefined(this.value)) {
                    return this.value.toJSON();
                }
                return [];
            }
        }),

        DocumentGridWidget = Widgets.DocumentGrid = Widget.extend({
            className: 'chf-field-document-grid',
            FieldModel: DocumentGridField,
            template: _.template('<div class="control-group">' +
                '<label>{{ label }}</label>' +
                '<div class="{{ grid_class }}"></div>' +
            '</div>'),
            idTemplate: _.template('<a href="{{ document_id }}">{{ document_id }}</a>'),

            initialize: function () {
                Widget.prototype.initialize.apply(this, arguments);
                _.bindAll(this, '_documentIDRenderer', '_controlsRenderer',
                                '_onCopyClick', '_onTrashClick');
            },

            _getDocumentAtRow: function (row) {
                if (row !== this._currentRow) {
                    this._currentRow = row;
                    this._currentDocument = this.model.value.at(row).toJSON();
                }
                return this._currentDocument;
            },

            _documentIDRenderer: function (instance, td, row, col, prop, value, cellProperties) {
                Handsontable.TextRenderer.apply(this, arguments);
                $(td).html(this.idTemplate({document_id: value}));
            },

            _documentIDEditor: function (instance, td, row, col, prop, keyboardProxy, cellProperties) {
                keyboardProxy.on("keydown.editor", function (event) {
                    switch (event.keyCode) {
                        case 13:
                            event.stopImmediatePropagation();
                            window.location.assign($(keyboardProxy).val());
                            break;
                    }
                });
            },

            _controlsRenderer: function (instance, td, row, col, prop, value, cellProperties) {
                var $controls = $(this._controlsTemplate({document_id: value})).click(this._onCopyClick);
                $(td).html($controls).addClass(this.model.get('controls_class'));
            },

            gridHeaders: function (controlsEnabled) {
                var headers = ['ID'];
                if (controlsEnabled) {
                    headers.push('&nbsp;');
                }
                return headers.concat(this.model.get('fields'));
            },

            gridColumns: function (controlsEnabled) {
                var columns = [{data: '_id', type: {
                    renderer: this._documentIDRenderer,
                    editor: this._documentIDEditor
                }}];

                if (controlsEnabled) {
                    columns.push({data: '_control', type: {renderer: this._controlsRenderer, editor: bullocks}});
                }
                return columns.concat(_.map(this.model.get('fields'), function (field) {
                    return {data: field};
                }));
            },

            render: function () {
                Widget.prototype.render.call(this);
                this._renderGrid();
                return this;
            },

            copyButtonTemplate: '<a href="#" rel="{{ document_id }}" class="">' +
                '<i class="icon-copy"></i></a>',
            trashButtonTemplate: '<a href="#" rel="{{ document_id }}" class="">' +
                '<i class="icon-trash"></i></a>',
            controlsTemplate: '<div class="">{{ controls }}</div>',

            _renderGrid: function () {
                var canCopy = this.model.get('can_copy'),
                    canDelete = this.model.get('can_delete'),
                    controlsEnabled = this._controlsEnabled = canCopy || canDelete,
                    controls = '';

                if (controlsEnabled) {
                    if (canCopy && canDelete) {
                        controls = this.copyButtonTemplate + this.trashButtonTemplate;
                    } else if (canCopy) {
                        controls = this.copyButtonTemplate;
                    } else if (canDelete) {
                        controls = this.trashButtonTemplate;
                    }
                    this._controlsTemplate = _.template(_.template(this.controlsTemplate, _.extend({},
                        this.model.toJSON(), {controls: controls})));
                } else {
                    this._controlsTemplate = undefined;
                }
                this.$grid = this.$('.' + this.model.get('grid_class')).handsontable({
                    data: this.model.gridData(),
                    startRows: 20,
                    colHeaders: this.gridHeaders(controlsEnabled),
                    columns: this.gridColumns(controlsEnabled),
                    scrollH: 'auto',
                    scrollW: 'auto',
                    stretchH: 'all'
                });
                return this;
            },

            _onCopyClick: function () {
                console.debug('DocumentGridField._onCopyClick');
            },

            _onTrashClick: function () {
                console.debug('DocumentGridField._onTrashClick');
            }
        });
});