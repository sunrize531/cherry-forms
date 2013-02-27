define(['underscore', 'core', 'less!chf-charts.less'], function (_, CherryForms) {
    "use strict";

    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Events = CherryForms.Events,
        DATA_UPDATE_EVENT = 'chart:data_update',

        ChartField = Fields.Chart = Field.extend({
            defaults: function () {
                return _.extend({}, Field.prototype.defaults.call(this), {
                    chart_class: 'chf-chart'
                });
            },

            initialize: function () {
                Field.prototype.initialize.apply(this, arguments);
                this.on('change:data', this._onDataSet, this);
            },

            _onDataSet: function () {
                this.trigger(DATA_UPDATE_EVENT);
            }
        }),

        ChartWidget = Widgets.Chart = Widget.extend({
            template: _.template('<div class="control-group">' +
                '<label>{{ label }}</label>' +
                '<div class="{{ chart_class }}"></div>' +
            '</div> '),
            FieldModel: ChartField,
            className: 'chf-field-chart',

            $getChart: function () {
                if (_.isUndefined(this.$chart)) {
                    this.$chart = this.$('.' + this.model.get('chart_class'));
                }
                return this.$chart;
            },

            render: function () {
                Widget.prototype.render.apply(this, arguments);
                this.renderChart();
                this.listenTo(this.model, 'change:data', this.renderChart);
                this.listenTo(CherryForms, Events.TAB_SHOWN, this.renderChart);
                return this;
            },

            renderChart: function () {
                throw 'Implement it in subclass';
            }
        });

    return CherryForms;
});

