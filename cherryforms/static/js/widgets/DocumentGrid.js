define(['underscore', 'backbone', 'handsontable', 'core', 'utils', 'widgets/Identifier',
    'less!chf-document-grid.less', 'css!jquery.handsontable.css'],
    function (_, Backbone, Handsontable, CherryForms, Utils) {
    "use strict";

    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,

        Models = CherryForms.Models,
        Schema = Models.Schema,
        Document = Models.Document,

        Fields = CherryForms.Fields,
        Field = Fields.Field,

        Events = CherryForms.Events,
        bullocks = function () {
            // console.debug('bullocks', arguments);
            return false;
        },

        Row = Document.extend({
            toJSON: function () {
                return _.extend({}, Document.prototype.toJSON.call(this), {
                    _control: this.id
                });
            }
        }),

        DocumentGrid = Models.DocumentsCollection.extend({
            model: Row
        }),

        DocumentGridField = Fields.DocumentGrid = Field.extend({
            defaults: function () {
                return _.extend({}, Field.prototype.defaults.call(this), {
                    'crud_url': '',
                    'grid_class': 'chf-grid',
                    'controls_class': 'chf-controls',
                    'button_cell': 'chf-cell-button',
                    'copy_button': 'chf-copy-button',
                    'del_button': 'chf-trash-button',
                    'copy_dialog': 'chf-copy-dialog',
                    'copy_document_button': 'chf-copy-document-button',
                    'cancel_document_button': 'chf-cancel-document-button'
                });
            },

            initialize: function () {
                Field.prototype.initialize.apply(this, arguments);
            },

            processValue: function () {
                this.value = new DocumentGrid(this.get('value'));
                this.value.url = this.get('crud_url');
                this.trigger(Events.FIELD_CHANGE, this);
            },

            gridHeaders: function () {
                return this.get('fields');
            },

            gridColumns: function () {
                return _.map(this.get('fields'), function (field) {
                    return {
                        data: field
                    };
                });
            },

            gridData: function () {
                var data = [],
                    rowData;
                if (!_.isUndefined(this.value)) {
                    return this.value.map(function (row) {
                        rowData = {};
                        _.each(row.toJSON(), function (value, key) {
                            if (!Utils.isSimple(value)) {
                                rowData[key] = JSON.stringify(value);
                            } else {
                                rowData[key] = value;
                            }
                        });
                        return rowData;
                    });
                }
                return [];
            }
        }),

        Identifier = Widgets.Identifier,

        COPY_DOCUMENT_CLICK = 'click:copy_document_button',
        CANCEL_DOCUMENT_CLICK = 'click:cancel_document_button',

        CopyDocumentDialog = Identifier.extend({
            template: _.template(
                '<div class="{{ copy_dialog }}">' +
                    '<div class="modal-header">Copy document</div>' +
                    '<div class="modal-body">' +
                        '<label>Save document with new id:</label>' +
                        '<input type="text" id="{{ input_id }}" value="{{ value }}" class="{{ input_class }}">' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<a href="#" class="btn {{ cancel_document_button }}">Cancel</a>' +
                        '<a href="#" class="btn btn-primary {{ copy_document_button }}">Copy</a>' +
                    '</div>' +
                '</div>'
            ),
            className: 'modal',

            events: function () {
                var events = Identifier.prototype.events.apply(this, arguments);
                events['click .modal-footer .' + this.model.get('copy_document_button')] = 'copyClickHandler';
                events['click .modal-footer .' + this.model.get('cancel_document_button')] = 'cancelClickHandler';
                return events;
            },

            copyClickHandler: function () {
                this.trigger(COPY_DOCUMENT_CLICK, this.model.value);
            },

            cancelClickHandler: function () {
                this.trigger(CANCEL_DOCUMENT_CLICK, this.model.value);
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
                _.bindAll(this, 'documentIDRenderer', 'controlsRenderer', 'controlsClickHandler');
            },

            documentIDRenderer: function (instance, td, row, col, prop, value, cellProperties) {
                Handsontable.TextRenderer.apply(this, arguments);
                $(td).html(this.idTemplate({document_id: value}));
            },

            documentIDEditor: function (instance, td, row, col, prop, keyboardProxy, cellProperties) {
                console.log(arguments);
                keyboardProxy.on("keydown.editor", function (event) {
                    switch (event.keyCode) {
                    case 13:
                        event.stopImmediatePropagation();
                        window.location.assign($(keyboardProxy).val());
                        break;
                    }
                });
            },

            controlsRenderer: function (instance, td, row, col, prop, value, cellProperties) {
                var $controls = $(this._controlsTemplate(
                    _.extend({document_id: value}, this.model.toJSON())
                )).click(this.controlsClickHandler);
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
                    renderer: this.documentIDRenderer,
                    editor: this.documentIDEditor
                }}];

                if (controlsEnabled) {
                    columns.push({data: '_control', type: {renderer: this.controlsRenderer, editor: bullocks}});
                }
                return columns.concat(_.map(this.model.get('fields'), function (field) {
                    return {data: field};
                }));
            },

            render: function () {
                Widget.prototype.render.call(this);
                this.renderGrid();
                return this;
            },

            copyButtonTemplate: '<a href="#" rel="{{ document_id }}" class="{{ copy_button }}">' +
                '<i class="icon-copy"></i></a>',
            trashButtonTemplate: '<a href="#" rel="{{ document_id }}" class="{{ del_button }}">' +
                '<i class="icon-trash"></i></a>',
            controlsTemplate: '<div class="">{{ controls }}</div>',

            renderGrid: function () {
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

            refreshGrid: function () {
                this.$grid.handsontable('loadData', this.model.gridData());
                this.$grid.handsontable('render');
            },

            getCopyDocumentDialog: function () {
                if (_.isUndefined(this._copyDialog)) {
                    var copyDialog = this._copyDialog = new CopyDocumentDialog(_.extend(
                        {},
                        _.pick(this.model.toJSON(), 'copy_dialog',
                            'copy_document_button', 'cancel_document_button')
                    ));
                    this._copyDialog.render();
                    this.listenTo(copyDialog, COPY_DOCUMENT_CLICK, this.copyDocumentHandler);
                    this.listenTo(copyDialog, CANCEL_DOCUMENT_CLICK, this.cancelDocumentHandler);
                    this.$el.append(copyDialog.$el);
                }
                return this._copyDialog;
            },

            controlsClickHandler: function (event) {
                var $button = $(event.target).parent('a'),
                    documentID = $button.prop('rel'),
                    crudURL = this.model.get('crud_url'),
                    copyDialog, document;
                if (crudURL) {
                    if ($button.hasClass(this.model.get('copy_button'))) {
                        copyDialog = this.getCopyDocumentDialog();
                        copyDialog.sourceDocumentID = documentID;
                        copyDialog.setValue(documentID + '_copy');
                        copyDialog.$el.modal('show');
                    } else {
                        this.destroyDocument(documentID);
                        console.log('Removing document', documentID);
                    }
                }
                return false;
            },

            copyDocumentHandler: function () {
                var documentsCollection = this.model.value,
                    copyDocumentDialog = this.getCopyDocumentDialog(),
                    sourceDocumentID = copyDocumentDialog.sourceDocumentID,
                    copyDocumentID = copyDocumentDialog.model.value,
                    document = documentsCollection.get(sourceDocumentID),
                    documentCopy = document.clone();
                documentCopy.set('_id', copyDocumentID);
                documentsCollection.add(documentCopy);
                documentCopy.save();
                copyDocumentDialog.modal('hide');
                this.refreshGrid();
            },

            cancelDocumentHandler: function () {
                this.getCopyDocumentDialog().$el.modal('hide');
            },

            destroyDocument: function (documentID) {
                var documentsCollection = this.model.value,
                    document = documentsCollection.get(documentID);

                if (!_.isUndefined(document)) {
                    document.destroy();
                    this.refreshGrid();
                }
            }
        });
});