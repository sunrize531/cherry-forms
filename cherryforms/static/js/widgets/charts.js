define(['underscore', 'core',
    'goog!visualization,1,packages:[corechart]'], function (_, CherryForms) {
    "use strict";

    var Widgets = CherryForms.Widgets,
        Widget = Widgets.Widget,
        Fields = CherryForms.Fields,
        Field = Fields.Field,
        Events = CherryForms.Events,
        vis = google.visualization,

        LineChartField = Fields.LineChart = Field.extend({
            defaults: function () {
                return _.extend({}, Field.prototype.defaults.call(this), {
                    chart_class: 'chf-chart'
                });
            },

            initialize: function () {
                Field.prototype.initialize.apply(this, arguments);
                this.data = vis.arrayToDataTable(this.get('data'));
            }
        }),

        LineChartWidget = Widgets.LineChart = Widget.extend({
            template: _.template('<div class="control-group">' +
                '<label>{{ label }}</label>' +
                '<div class="{{ chart_class }}"></div>' +
            '</div> '),
            FieldModel: LineChartField,

            getChart: function () {
                if (_.isUndefined(this._chart)) {
                    this._chart = this.$('.' + this.model.get('chart_class'))[0];
                }
                return this._chart;
            },

            render: function () {
                Widget.prototype.render.apply(this, arguments);
                this.chart = new vis.LineChart(this.getChart());
                this.chart.draw(this.model.data);
                return this;
            }
        }),

        // TODO: make prototype for both charts.
        PieChartField = Fields.PieChart = Field.extend({
            defaults: function () {
                return _.extend({}, Field.prototype.defaults.call(this), {
                    chart_class: 'chf-chart'
                });
            },

            initialize: function () {
                Field.prototype.initialize.apply(this, arguments);
                this.data = vis.arrayToDataTable(this.get('data'));
            }
        }),

        PieChartWidget = Widgets.PieChart = Widget.extend({
            template: _.template('<div class="control-group">' +
                '<label>{{ label }}</label>' +
                '<div class="{{ chart_class }}"></div>' +
            '</div> '),
            FieldModel: LineChartField,

            getChart: function () {
                if (_.isUndefined(this._chart)) {
                    this._chart = this.$('.' + this.model.get('chart_class'))[0];
                }
                return this._chart;
            },

            render: function () {
                Widget.prototype.render.apply(this, arguments);
                this.chart = new vis.PieChart(this.getChart());
                this.chart.draw(this.model.data);
                return this;
            }
        });


    return CherryForms;
});