define(['underscore', 'backbone', 'core', 'utils', 'widgets/text', 'widgets/select'],
    function (_, Backbone, CherryForms, Utils) {
    "use strict";
    var Models = CherryForms.Models,

        Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,

        Fields = CherryForms.Fields,
        Field = Fields.Field,
        SelectField = Fields.Select,

        Templates = CherryForms.Templates,
        Events = CherryForms.Events,
        isUnset = Utils.isUnset,
        Unset = Utils.Unset,

        Translation = Models.Document.extend({
            url: '/widgets/translations/'
        }),

        TranslationsCollection = Models.DocumentsCollection.extend({
            model: Translation,
            url: '/widgets/translations/'
        }),
        translationsCollection = new TranslationsCollection(),

        LanguageSelector, languageTemplate,
        LANGUAGE_SELECT = 'language:select',

        SelectTranslationField, TranslationField, TranslationWidget,

        createTranslationTemplate = _.template('<div class="input-append">' +
                '<input id="{{ input_id }}" type="text" class="input-large">' +
                '<a href="#" class="btn {{ create_button }}">New</a>' +
            '</div>'),

        selectTranslationTemplate = _.template('<div class="input-append">' +
                '<select id="{{ input_id }}" class="input-large"></select>' +
                '<a href="#" class="btn {{ select_button }}">Select</a>' +
            '</div>'),

        editTranslationTemplate = _.template(
            '<div class="control-group">' +
                '<div class="well well-small {{ preview_class }}">{{ value }}</div>' +
                '<div class="{{ textarea_class }}">' +
                    '<textarea rows="5" cols="80" id="{{ input_id }}" class="input-block-level">' +
                        '{{ value }}</textarea>' +
                '</div>' +
            '</div>');

    TranslationField = Fields.Translation = Field.extend({
        defaults: function () {
            return _.extend({}, Field.prototype.defaults.call(this), {
                'preview_class': 'chf-translation-preview',
                'languages_class': 'chf-translation-languages',
                'language_class': 'chf-translation-language',
                'selected_lang_class': 'active',
                'editor_class': 'chf-translation-editor',
                'textarea_class': 'chf-field-textarea',
                'buttons_class': 'chf-field-buttons',
                'button_class': 'chf-button',
                'selector_class': 'chf-translation-selector',
                'select_class': 'chf-field-select',
                'create_class': 'chf-field-create',
                'create_button': 'chf-btn-create',
                'select_button': 'chf-btn-select',
                'save_button': 'chf-btn-save',
                'clear_button': 'chf-btn-clear'
            });
        },

        initialize: function () {
            _.bindAll(this, '_onTranslationLoaded', '_onTranslationIDsLoaded', '_onLanguagesLoaded');
            this.editorField = new Fields.TextArea({
                template: editTranslationTemplate
            });
            this.editorField.on(Events.FIELD_CHANGE, this._onTranslationChange, this);
            this.selectTranslationField = new Fields.Select(_.extend({
                    template: selectTranslationTemplate
                }, _.pick(this.toJSON(), 'select_button')));
            this.createTranslationField = new Fields.Identifier(_.extend({
                    template: createTranslationTemplate
                }, _.pick(this.toJSON(), 'create_button')));
            Field.prototype.initialize.apply(this, arguments);
            if (!this.has('languages')) {
                $.get('/widgets/languages', this._onLanguagesLoaded);
            } else {
                this.setLanguage();
            }
        },

        processValue: function () {
            var value = this.get('value');
            if (!value) {
                this.unsetValue();
            } else {
                translationsCollection.getDocuments(this.get('value'), this._onTranslationLoaded);
            }
        },

        _onTranslationLoaded: function () {
            this.value = translationsCollection.get(this.get('value'));
            this.setLanguage();
            this.trigger(Events.FIELD_CHANGE, this);
            this.trigger(Events.FIELD_READY, this);
        },

        unsetValue: function () {
            translationsCollection.getIDs(this._onTranslationIDsLoaded);
        },

        _onTranslationIDsLoaded: function () {
            Field.prototype.unsetValue.call(this);
            this.selectTranslationField.choices.add(translationsCollection.pluck('_id'));
            this.trigger(Events.FIELD_READY, this);
        },

        _onLanguagesLoaded: function (languages) {
            this.set('languages', languages);
            this.setLanguage();
            this.on('change:language', this.setLanguage, this);
        },

        setLanguage: function () {
            var languages = this.get('languages'),
                language = this.get('language'),
                value = this.value;
            if (!language) {
                language = languages[0];
                this.set('language', language);
            }
            if (value && !isUnset(value)) {
                this.editorField.set('value', this.value.get(language));
            }
        },

        _onTranslationChange: function () {
            this.value.set(this.get('language'), this.editorField.dumpValue());
        },

        dumpValue: function () {
            return this.plainValue();
        },

        plainValue: function () {
            if (!isUnset(this.value)) {
                return this.value.id;
            }
            return this.value;
        }
    });

    languageTemplate = _.template(
        '<a href="#" class="btn btn-mini {{ language_class }}">{{ language }}</a>');
    LanguageSelector = Backbone.View.extend({
        events: function () {
            var events = {};
            events['click .' + this.model.get('language_class')] = '_onSelect';
            return events;
        },

        initialize: function () {
            this.model.on('change:languages', this._renderLanguages, this);
            this.model.on('change:language', this._toggleLanguage, this);
        },

        _renderLanguages: function () {
            var languages = this.model.get('languages'),
                languageClass = this.model.get('language_class');
            this.$el.html(_.map(languages, function (l) {
                return languageTemplate({language_class: languageClass, language: l});
            }).join('\n'));
        },

        _toggleLanguage: function () {
            this.$('.' + this.model.get('language_class') + ':contains(' + this.model.get('language') + ')')
                .button('toggle');
        },

        render: function () {
            this._renderLanguages();
            return this;
        },

        _onSelect: function (event) {
            this.model.set('language', $(event.target).text());
        }
    });

    Widgets.Translation = Widget.extend({
        FieldModel: TranslationField,
        template: _.template(
            '<div class="control-group">' +
                '<label for="{{ input_id }}">{{ label }}</label>' +
                '<div class="{{ editor_class }}">' +
                    '<div class="row-fluid">' +
                        '<div class="span1 btn-group-vertical {{ languages_class }}" ' +
                            'data-toggle="buttons-radio"></div>' +
                        '<div class="span11 {{ textarea_class }}"></div>' +
                    '</div>' +
                    '<div class="row-fluid">' +
                        '<div class="offset1 btn-group {{ buttons_class }}">' +
                            '<button class="btn btn-mini {{ button_class }} {{ save_button}}">' +
                                'Save</button>' +
                            '<button class="btn btn-mini btn-danger {{ button_class }} {{ clear_button }}">' +
                                'Clear</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="{{ selector_class }}">' +
                    '<div class="{{ select_class }}" id="{{ input_id }}-create-field"></div>' +
                    '<div class="{{ create_class }}" id="{{ input_id }}-select-field"></div>' +
                '</div>' +
            '</div>'
        ),

        initialize: function () {
            Widget.prototype.initialize.apply(this, arguments);
            this.model
                .on(Events.FIELD_CHANGE, this.showEditor, this)
                .on(Events.FIELD_CLEAR, this.showSelector, this);
        },

        events: function () {
            var events = {},
                model = this.model;
            events['click .' + model.get('select_button')] = '_selectTranslation';
            events['click .' + model.get('create_button')] = '_createTranslation';
            events['click .' + model.get('save_button')] = '_saveTranslation';
            events['click .' + model.get('clear_button')] = '_clearTranslation';
            return events;
        },

        render: function () {
            Widget.prototype.render.call(this);
            this.languages = new LanguageSelector({
                el: this.$('.' + this.model.get('languages_class')),
                model: this.model
            });
            this.languages.render();

            this.translationEditor = new Widgets.TextArea({
                model: this.model.editorField,
                el: this.$('.' + this.model.get('textarea_class'))
            });
            this.translationEditor.render();

            this.createTranslationWidget = new Widgets.Identifier({
                el: this.$('.' + this.model.get('create_class')),
                model: this.model.createTranslationField
            });
            this.createTranslationWidget.render();

            this.selectTranslationWidget = new Widgets.Select({
                el: this.$('.' + this.model.get('select_class')),
                model: this.model.selectTranslationField
            });
            this.selectTranslationWidget.render();

            this.$editor = this.$('.' + this.model.get('editor_class'));
            this.$selector = this.$('.' + this.model.get('selector_class'));

            if (isUnset(this.model.value)) {
                this.showSelector();
            } else {
                this.showEditor();
            }
        },

        showEditor: function () {
            this.$editor.show();
            this.$selector.hide();
            this._editorMode = true;
        },

        showSelector: function () {
            this.$editor.hide();
            this.$selector.show();
            this._editorMode = false;
        },

        _selectTranslation: function () {
            this.model.set('value', this.selectTranslationWidget.model.dumpValue());
            return false;
        },

        _createTranslation: function () {
            console.debug('TranslationWidget._createTranslation', this.createTranslationWidget.model.value);
            var translationID = this.createTranslationWidget.model.value,
                translation = new Translation({_id: translationID});
            translationsCollection.add(translation);
            translation.save();
            this.model.set('value', translationID);
            return false;
        },

        _saveTranslation: function () {
            this.model.value.save();
            return false;
        },

        _clearTranslation: function () {
            this.model.set('value', undefined);
            return false;
        }
    });
});
