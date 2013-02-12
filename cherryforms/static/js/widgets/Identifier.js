define(['underscore', 'backbone', 'core', 'widgets/Text'], function(_, Backbone, CherryForms) {
    "use strict";
    var Widgets = CherryForms.Widgets,
        Fields = CherryForms.Fields,
        Patterns = CherryForms.Patterns,

        IDENTIFIER_PATTERN = Patterns.IDENTIFIER_PATTERN = /^[\w_][\w\d_\-]*$/i,

        TextField = Fields.Text,
        TextWidget = Widgets.Text;


    Fields.Identifier = TextField.extend({
        pattern: IDENTIFIER_PATTERN
    });

    Widgets.Identifier = TextWidget.extend({
        FieldModel: Fields.Identifier
    });
    return CherryForms;
});