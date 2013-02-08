define(['underscore', 'core',
    'goog!visualization,1,packages:[corechart]'], function (_, CherryForms) {
    "use strict";

    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Events = CherryForms.Events,
        vis = google.visualization,

        DATA_UPDATE_EVENT = 'chart:data_update',

        ChartField = Field.extend({
            defaults: function () {
                return _.extend({}, Field.prototype.defaults.call(this), {
                    chart_class: 'chf-chart'
                });
            },

            initialize: function () {
                Field.prototype.initialize.apply(this, arguments);
                this._onDataSet();
                this.on('change:data', this._onDataSet, this);
            },

            _onDataSet: function () {
                this.data = vis.arrayToDataTable(this.get('data'));
                this.trigger(DATA_UPDATE_EVENT);
            }
        }),

        ChartWidget = Widget.extend({
            template: _.template('<div class="control-group">' +
                '<label>{{ label }}</label>' +
                '<div class="{{ chart_class }}"></div>' +
            '</div> '),
            FieldModel: ChartField,

            $getChart: function () {
                if (_.isUndefined(this.$chart)) {
                    this.$chart = this.$('.' + this.model.get('chart_class'))[0];
                }
                return this.$chart;
            },

            initChart: function () {
                throw 'Implement it in subclass';
            },

            getChart: function () {
                if (_.isUndefined(this._chart)) {
                    this._chart = this.initChart();
                }
                return this._chart;
            },

            render: function () {
                Widget.prototype.render.apply(this, arguments);
                this.refreshChart();
                this.listenTo(this.model, DATA_UPDATE_EVENT, this.refreshChart);
                this.listenTo(CherryForms, Events.TAB_SHOWN, this.refreshChart);
                return this;
            },

            refreshChart: function () {
                this.getChart().draw(this.model.data);
            }
        }),

        LineChartField = Fields.LineChart = ChartField.extend({
        }),

        LineChartWidget = Widgets.LineChart = ChartWidget.extend({
            FieldModel: LineChartField,

            initChart: function () {
                return new vis.LineChart(this.$getChart());
            }
        }),

        PieChartField = Fields.PieChart = ChartField.extend({
        }),

        PieChartWidget = Widgets.PieChart = ChartWidget.extend({
            FieldModel: PieChartField,

            initChart: function () {
                return new vis.PieChart(this.$getChart());
            }
        });
    return CherryForms;
});