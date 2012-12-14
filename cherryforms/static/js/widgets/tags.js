(function () {
    "use strict";
    var CherryForms = window.CherryForms,
        Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Templates = CherryForms.Templates,
        Events = CherryForms.Events;

    Widgets.Tags = Widget.extend({
        template: 'Tags',
        className: 'tsadmin-field-tags',

        defaults: {
            tag_class: 'tsadmin-field-tag',
            checked_class: 'tsadmin-field-tag-checked',
            tags_class: 'tsadmin-field-list'
        },

        events: function () {
            var events = {};
            events['click .' + this.options['tag_class']] = 'toggleTag';
            return events;
        },

        bindMethods: ['toggleTag'],

        toggleTag: function (event) {
            var $target = $(event.currentTarget),
                tag = $target.text(),
                value = this.getValue(),
                index = value.indexOf(tag);
            if (index !== -1) {
                value.splice(index, 1);
            } else {
                value.push(tag);
            }
            $target.toggleClass(this.options['checked_class']);
            this.trigger(Events.FIELD_CHANGE, this);
            return false;
        },

        render: function () {
            Widget.prototype.render.call(this);
            var tags = this.options['tags'],
                value = this.getValue(),
                $tags = this.$('.' + this.options['tags_class']),
                tagOptions = _.pick(this.options, 'tag_class', 'checked_class');
            $tags.html(_.map(tags, function (tag) {
                return Templates.Tag(_({tag: tag, checked: _.include(value, tag)}).extend(tagOptions));
            }).join(' '));
            return this;
        }
    });

    Templates.Tag = _.template(
        '<a href="#" class="{{ tag_class }}{% if (checked) { %} {{ checked_class }}{% } %}">{{ tag }}</a>'
    );
    Templates.Tags = _.template(
        '{{ label }}<div class="{{ tags_class }}"></div>'
    );
}());
