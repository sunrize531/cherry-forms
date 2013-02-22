define(['underscore', 'backbone', 'core', 'widgets/Text'], function(_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Widget = Widgets.Widget,
        Templates = CherryForms.Templates,
        TextField = Fields.Text;

    Templates.TextArea = _.template(
        '<div class="control-group">' +
            '<label for="{{ input_id }}">{{ label }}</label>' +
            '<div class="well well-small {{ preview_class }}">{{ value }}</div>' +
            '<div class="{{ textarea_class }}">' +
                '<textarea rows="5" cols="80" id="{{ input_id }}" class="{{ input_class }}">{{ value }}</textarea>' +
            '</div>' +
        '</div>');

    Fields.TextArea = TextField.extend({
        defaults: function () {
            return _.extend({}, TextField.prototype.defaults.call(this), {
                'field_class': 'chf-field-textarea',
                'preview_class': 'chf-field-preview',
                'textarea_class': 'chf-field-editor'
            });
        }
    });

    Widgets.TextArea = Widget.extend({
        FieldModel: Fields.TextArea,
        template: 'TextArea',
        className: 'chf-field-textarea',

        events: function () {
            var events = Widget.prototype.events.call(this);
            events['click .' + this.model.get('preview_class')] = 'edit';
            events['blur textarea'] = 'view';
            return events;
        },

        render: function () {
            Widget.prototype.render.call(this);
            this.getTextArea().hide();
        },

        getView: function () {
            if (_.isUndefined(this._view)) {
                this._view = this.$('.' + this.model.get('preview_class'));
            }
            return this._view;
        },

        getTextArea: function () {
            if (_.isUndefined(this._textarea)) {
                this._textarea = this.$('.' + this.model.get('textarea_class'));
            }
            return this._textarea;
        },

        edit: function () {
            this.getView().hide();
            this.getTextArea().show();
            this.getInput().focus();
        },

        view: function () {
            this.getTextArea().hide();
            this.getView().html(this.model.value).show();
        },

        _onValidate: function() {
            Widget.prototype._onValidate.apply(this, arguments);
            this.getInput().val(this.model.value);
            this.getView().html(this.model.value);
        }
    });
    return CherryForms;
});