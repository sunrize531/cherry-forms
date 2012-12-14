define(['jquery', 'underscore', 'backbone', 'utils', 'bootstrap'], function ($, _, Backbone, Utils) {
    'use strict';

    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g,
        evaluate: /\{%(.+?)%\}/g
    };

    var CherryForms = {},
        Events = CherryForms.Events = {
            FIELD_CHANGE: 'field:change',
            FIELD_CLEAR: 'field:clear',
            FIELD_READY: 'field:ready',
            BUTTON_CLICK: 'button:click'
        },

        Widgets = CherryForms.Widgets = {},
        Templates = CherryForms.Templates = {},
        Models = CherryForms.Models = {},
        Fields = CherryForms.Fields = {},
        Patterns = CherryForms.Patterns = {},
        Unset = Utils.Unset,
        isUnset = Utils.isUnset,

        Document = Models.Document = Backbone.Model.extend({
            idAttribute: '_id'
        }),

        DocumentsCollection = Models.DocumentsCollection = Backbone.Collection.extend({
            model: Document,
            _idsLoading: undefined,

            initialize: function () {
                _.bindAll(this,
                    '_onIDsSuccess', '_onIDsFail',
                    '_getDocumentsRequest', '_onDocumentsSuccess', '_onDocumentsFail');
            },

            fetch: function (options) {
                options = options || {};
                _.defaults(options, {
                    traditional: true
                });
                Backbone.Collection.prototype.fetch.call(this, options);
            },

            _deferCallbacks: function (deferred, success, error) {
                if (_.isFunction(success)) {
                    deferred.done(success);
                }
                if (_.isFunction(error)) {
                    deferred.fail(error);
                }
            },

            isIDsLoading: function () {
                return !_.isUndefined(this._idsLoading) &&
                    this._idsLoading.state() === 'pending' && this._idsLoading;
            },

            getIDs: function (success, error, reload) {
                var idsLoading = this.isIDsLoading();

                if (reload) {
                    if (idsLoading) {
                        idsLoading.reject('IDs call canceled');
                        this._idsLoading = undefined;
                    }
                    this.reset();
                }

                // if loading is in progress just deffer handlers provided in options.
                if (idsLoading) {
                    this._deferCallbacks(idsLoading, success, error);
                } else {
                    if (this.length) {
                        // Just execute success callback then
                        if (_.isFunction(success)) {
                            success.call(null, this);
                        }
                    } else {
                        // Create deferred and then defer jQuery request.
                        this._idsLoading = new $.Deferred();
                        this._deferCallbacks(this._idsLoading, success, error);
                        _.defer($.ajax, {
                            url: this.url,
                            data: {'keys': true},
                            success: this._onIDsSuccess,
                            error: this._onIDsFail
                        });
                    }
                }
                return this;
            },

            _onIDsSuccess: function (response) {
                this.add(_.map(response, function (id) {
                    return {_id: id};
                }));
                this._idsLoading.resolve(this);
                this._idsLoading = undefined;
            },

            _onIDsFail: function () {
                console.error('Unable to get ids');
                this._idsLoading.reject('Unable to get ids');
            },

            _documentsQueue: undefined,
            _documentsLoading: undefined,
            isDocumentsLoading: function () {
                return _.isUndefined(this._documentsQueue) && !_.isUndefined(this._documentsLoading) &&
                    this._documentsLoading.state() === 'pending' && this._documentsLoading;
            },

            isDocumentsQueued: function () {
                return _.isArray(this._documentsQueue) && this._documentsLoading;
            },

            getDocuments: function (ids, success, error) {
                var documentsLoading = this.isDocumentsLoading(),
                    deferredCall;
                if (documentsLoading) {
                    // Defer request to wait till current request complete
                    deferredCall = _.bind(this.getDocuments, this, ids, success, error);
                    documentsLoading.always(deferredCall);
                    return this;
                }

                if (!_.isArray(ids)) {
                    ids = [ids];
                }

                documentsLoading = this.isDocumentsQueued();
                if (documentsLoading) {
                    // Add ids to list and register callbacks
                    if (this._documentsQueue.length) {
                        this._documentsQueue = this._documentsQueue.concat(ids);
                    }
                    this._deferCallbacks(documentsLoading, success, error);
                } else {
                    this._documentsQueue = ids.slice();
                    documentsLoading = this._documentsLoading = new $.Deferred();
                    this._deferCallbacks(documentsLoading, success, error);
                    _.defer(this._getDocumentsRequest);
                }
                return this;
            },

            getAll: function (success, error) {
                var documentsLoading = this.isDocumentsLoading(),
                    deferredCall;
                if (documentsLoading) {
                    // Defer request to wait till current request complete
                    deferredCall = _.bind(this.getAll, this, success, error);
                    documentsLoading.always(deferredCall);
                    return this;
                }

                documentsLoading = this.isDocumentsQueued();
                this._documentsQueue = [];
                if (documentsLoading) {
                    this._deferCallbacks(documentsLoading, success, error);
                } else {
                    documentsLoading = this._documentsLoading = new $.Deferred();
                    this._deferCallbacks(documentsLoading, success, error);
                    _.defer(this._getDocumentsRequest);
                }
                return this;

            },

            _getDocumentsRequest: function () {
                var data = {};
                if (this._documentsQueue.length) {
                    data['ids'] = this._documentsQueue.slice();
                }
                $.ajax({
                    url: this.url,
                    data: data,
                    traditional: true,
                    success: this._onDocumentsSuccess,
                    error: this._onDocumentsFail
                });
                this._documentsQueue = undefined;
            },

            _onDocumentsSuccess: function (documents) {
                _.each(documents, function (document) {
                    var current = this.get(document['_id']);
                    if (!_.isUndefined(current)) {
                        current.set(document);
                    } else {
                        this.add(document);
                    }
                }, this);
                this._documentsLoading.resolve(this);
                this._documentsLoading = undefined;
            },

            _onDocumentsFail: function () {
                console.error('Documents request failed');
                this._documentsLoading.reject('Documents request failed.');
                this._documentsLoading = undefined;
            }
        }),

        Field = Fields.Field = Backbone.Model.extend({
            idAttribute: 'field_id',
            defaults: function () {
                return {
                    'changed': false,
                    'field_id': _.uniqueId('chf-field-'),
                    'field_class': ''
                };
            },

            initialize: function () {
                this.set('input_id', 'input-' + this.get('field_id'));
                this
                    .on('change:value', this._onChange, this)
                    .on('error', this._onError, this);
                this.value = new Unset();
                this.processValue();
            },

            _onChange: function () {
                this.valid = true;
                this.processValue();
            },

            _onError: function () {
                this.valid = false;
                this.unsetValue();
            },

            processValue: function () {
                this.value = this.get('value');
                this.trigger(Events.FIELD_CHANGE, this);
            },

            unsetValue: function () {
                if (!isUnset(this.value)) {
                    this.value = new Unset();
                    this.trigger(Events.FIELD_CLEAR, this);
                }
            },

            dumpValue: function () {
                return this.value;
            },

            plainValue: function () {
                return this.value;
            },

            toJSON: function () {
                return _.defaults(Backbone.Model.prototype.toJSON.call(this), {
                    label: this.get('field') + ':'
                });
            }
        }),

        Schema = Models.Schema = Backbone.Collection.extend({
            model: function (attributes, options) {
                var widget = attributes['widget'],
                    FieldClass = Fields[widget];
                return new FieldClass(attributes, options);
            }
        }),

        Widget = Widgets.Widget = Backbone.View.extend({
            FieldModel: Field,

            attributes: function () {
                var classes = ['chf-field'],
                    attributes = {},
                    fieldClass;

                if (this.model) {
                    fieldClass = this.model.get('field_class');
                    if (fieldClass) {
                        classes.push(fieldClass);
                    }
                    attributes['id'] = this.model.id;
                } else {
                    attributes['id'] = _.uniqueId('chf-field-');
                }
                attributes['class'] = classes.join(' ');
                return attributes;
            },

            initialize: function (options) {
                var template = options['template'];
                if (!_.isUndefined(template)) {
                    this.template = template;
                }

                if (!this.model) {
                    this.model = new this.FieldModel(this.options);
                }

                this.model
                    .on('error', this._onError, this)
                    .on('change:value', this._onValidate, this);
            },

            _onError: function () {
                this.setErrorState();
            },

            _onValidate: function () {
                this.setValidState();
            },

            getInputID: function () {
                return this.model.get('input_id');
            },

            getTemplate: function () {
                var template = this.model.get('template') || this.template;
                if (_.isFunction(template)) {
                    return template;
                }
                if (_.isString(template)) {
                    template = Templates[this.template];
                    if (_.isFunction(template)) {
                        return template;
                    }
                }
                console.error('Invalid template', this);
                throw 'Invalid template';
            },

            events: function (events) {
                events = events || {};
                events['change #' + this.getInputID()] = '_onChange';
                return events;
            },

            _onChange: function () {
                this.setValue(this.getInput().val());
            },

            getInput: function () {
                return this.$('#' + this.getInputID());
            },

            getValue: function () {
                return this.model.value;
            },

            dumpValue: function () {
                this.model.dumpValue();
            },

            setValue: function(value) {
                this.model.set('value', value);
            },

            render: function () {
                this.$el.append(this.getTemplate()(this.model.toJSON()));
                return this;
            },

            setErrorState: function () {
                this.$('.control-group').addClass('error');
            },

            setValidState: function () {
                this.$('.control-group').removeClass('error');
            }
        }),

        Button = Backbone.View.extend({
            events: {
                'click': 'onClick'
            },

            onClick: function () {
                this.trigger(Events.BUTTON_CLICK, this.$el.prop('id'));
                return false;
            }
        }),

        Form = Backbone.Model.extend({
            initialize: function () {
                this.fields = new Schema();
                this.fields
                    .on(Events.FIELD_CHANGE, this._onChange, this)
                    .on(Events.FIELD_CLEAR, this._onClear, this)
                    .on('error', this._onError, this);
                this.valid = true;
                this.dump = {};
            },

            _onChange: function (field) {
                console.debug('FormModel._onChange', field.plainValue());
                var value = field.value,
                    key = field.get('field');
                if (isUnset(value)) {
                    this.unset(key);
                    delete this.dump[key];
                } else {
                    this.set(key, field.plainValue());
                    this.dump[key] = field.dumpValue();
                }
            },

            _onClear: function (field) {
                console.debug('FormModel._onClear', field.toJSON());
            },

            _onError: function (field) {
                var key = field.get('field');
                this.unset(key);
                this.valid = false;
            },

            submit: function (options) {
                if (!this.valid) {
                    throw "Form is invalid";
                }
                var data = new FormData();
                _.each(this.dump, function (value, field) {
                    if (_.isUndefined(value)) {
                        value = null;
                    }
                    data.append(field, value);
                });
                options = options || {};
                _.defaults(options, {
                    url: window.location.href,
                    data: data,
                    type: 'POST',
                    cache: false,
                    contentType: false,
                    processData: false
                });
                $.ajax(options);
            }
        }),


        FormView = CherryForms.Form = Backbone.View.extend({
            initialize: function () {
                if (_.isUndefined(this.model)) {
                    this.model = new Form();
                }
                _.bindAll(this, 'submit', 'onChange');
            },

            addWidget: function (field, $el) {
                var fieldID = field.id,
                    WidgetClass, widget;
                if (_.isUndefined($el)) {
                    $el = this.$('#chf-field-' + fieldID);
                }
                if ($el.length) {
                    WidgetClass = Widgets[field.get('widget')];
                    widget = new WidgetClass(_.extend({form: this, el: $el, model: field}));
                    widget.render();
                    this.model.fields.add(widget.model);
                }
            },

            render: function () {
                var form = this,
                    schema = CherryForms.schema;

                _.each(this.$('.chf-field'), function (f) {
                    var $field = $(f),
                        fieldID = $field.prop('id'),
                        field = schema.get(fieldID.substr(-5));
                    if (!_.isUndefined(field)) {
                        this.addWidget(field, $field);
                    }
                }, this);
                schema.on('add', function (field) {
                    this.addWidget(field);
                }, this);

                this.$('.chf-form-buttons :button').each(function () {
                    var button = new Button({el: this});
                    button.render().on(Events.BUTTON_CLICK, form.submit);
                });

                this.$('.tab-content > div').addClass('tab-pane fade');
                this.$('ul.nav').tab();
                this.$('ul.nav a').click(function (e) {
                    e.preventDefault();
                    $(this).tab('show');
                });
                if ($('ul.nav .active').length) {
                    this.$('ul.nav .active').removeClass('active').find('a').tab('show');
                } else {
                    this.$('ul.nav a:first').tab('show');
                }
                return this;
            },

            getWidget: function (field) {
                return _.find(this.fields, function (f) {
                    return f.field === field;
                });
            },

            getValue: function (field) {
                return this.model.get('field');
            },

            setValues: function (data, silent) {
                _.each(data, function (value, field) {
                    var widget = this.getWidget(field);
                    if (!_.isUndefined(widget)) {
                        if (isUnset(value)) {
                            widget.setValue(undefined);
                        } else {
                            widget.setValue(value);
                        }
                    }
                }, this);
            },

            reset: function (data) {
                _.each(this.fields, function (widget) {
                    widget.setValue(undefined);
                });
                this.model.clear();
                this.setValues(data, true);
            },

            update: function (data) {
                this.setValues(data, false);
            },

            onChange: function (widget) {
                var set = {};
                set[widget.field] = widget.dumpValue();
                this.model.set(set);
                console.log('Form model updated', this.model.toJSON());
            },

            submit: function (action) {
                this.model.set({'_action': action});
                var options = {
                        success: _.bind(this.onSubmit, this),
                        error: _.bind(this.onError, this)
                    },
                    target = this.$el.prop('target');
                if (target) {
                    options['url'] = target;
                }
                this.model.submit(options);
                return false;
            },

            onSubmit: function (response) {
                if (_.isObject(response)) {
                    if (response['refresh']) {
                        window.location.reload();
                        return false;
                    }
                    var redirect = response['redirect'],
                        target = response['target'];
                    if (redirect) {
                        if (target) {
                            window.open(redirect, target || '_self');
                        } else {
                            window.location.assign(redirect);
                        }
                        return false;
                    }
                }
                return true;
            },

            onError: function () {
            }
        }),

        less = CherryForms.less = ['/static/admin/css/chf.less'],
        schema = CherryForms.schema = new Schema();

    Templates.Label = _.template('<label for="{{ input_id }}" title="{{ label }}">{{ label }}</label>');
    Templates.Hidden = _.template('<input type="hidden" id="{{ input_id }}" value="{{ value }}">');

    Fields.Hidden = Field.extend({
    });

    Widgets.Hidden = Widget.extend({
        template: Templates.Hidden,
        FieldModel: Fields.Hidden
    });

    return CherryForms;
});