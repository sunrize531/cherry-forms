define(['underscore', 'backbone', 'core'], function(_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Widget = Widgets.Widget,
        Templates = CherryForms.Templates,
        Events = CherryForms.Events;


    Templates.Hidden = _.template(
        '<input type="hidden" id="{{ input_id }}" value="{{ value }}" class="{{ input_class }}">');

    Fields.Hidden = Field.extend({});

    Widgets.Hidden = Widget.extend({
        template: Templates.Hidden,
        FieldModel: Fields.Hidden
    });

    return CherryForms;
});